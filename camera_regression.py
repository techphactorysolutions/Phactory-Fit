#!/usr/bin/env python3
"""iPhone/Safari camera lifecycle regression for PhactoryFit's barcode scanner."""
from __future__ import annotations

import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from browser_security import INLINE_HTML


CHROMIUM_EXECUTABLE = "/usr/bin/chromium" if Path("/usr/bin/chromium").exists() else None

async def main():
    async with async_playwright() as playwright:
        launch_options = {
            "headless": True,
            "args": ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
        }
        if CHROMIUM_EXECUTABLE:
            launch_options["executable_path"] = CHROMIUM_EXECUTABLE
        browser = await playwright.chromium.launch(**launch_options)
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            device_scale_factor=2,
            user_agent=(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
            ),
        )
        page = await context.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.set_content(INLINE_HTML, wait_until="domcontentloaded")
        result = await page.evaluate("""async () => {
          window.__cameraStops = 0;
          const track = {
            readyState:'live', muted:false, enabled:true,
            stop(){ this.readyState='ended'; window.__cameraStops += 1; if (typeof this.onended === 'function') this.onended(); },
            getSettings(){ return {deviceId:'rear-camera'}; },
            getCapabilities(){ return {}; },
            applyConstraints:async () => {}
          };
          const stream = {getTracks:() => [track], getVideoTracks:() => [track]};
          Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
            configurable:true,
            get(){ return this.__phactoryStream || null; },
            set(value){ this.__phactoryStream = value; }
          });
          HTMLMediaElement.prototype.play = async function(){ throw new DOMException('User gesture required', 'NotAllowedError'); };
          Object.defineProperty(navigator, 'mediaDevices', {
            configurable:true,
            value:{
              getUserMedia:async () => stream,
              enumerateDevices:async () => [{kind:'videoinput',deviceId:'rear-camera'}]
            }
          });
          openModal('barcode');
          await startBarcodeCamera(true);
          const beforePagehide = {
            modalOpen:modal.open,
            shellVisible:!document.querySelector('#barcodeCameraShell').hidden,
            cameraMode:modal.classList.contains('camera-active'),
            active:Boolean(activeMediaStream),
            stopped:window.__cameraStops,
            message:document.querySelector('#barcodeResult').textContent
          };
          window.dispatchEvent(new Event('pagehide'));
          await new Promise(resolve => setTimeout(resolve, 50));
          const afterPagehide = {
            active:Boolean(activeMediaStream),
            stopped:window.__cameraStops,
            shellVisible:!document.querySelector('#barcodeCameraShell').hidden
          };
          modal.close();
          modal.dispatchEvent(new Event('close'));
          await new Promise(resolve => setTimeout(resolve, 20));
          return {
            beforePagehide,
            afterPagehide,
            afterClose:{active:Boolean(activeMediaStream),stopped:window.__cameraStops}
          };
        }""")
        assert result["beforePagehide"]["modalOpen"], result
        assert result["beforePagehide"]["shellVisible"], result
        assert result["beforePagehide"]["cameraMode"], result
        assert result["beforePagehide"]["active"], result
        assert result["beforePagehide"]["stopped"] == 0, result
        assert "Start preview" in result["beforePagehide"]["message"], result
        assert result["afterPagehide"] == {"active": True, "stopped": 0, "shellVisible": True}, result
        assert result["afterClose"]["active"] is False, result
        assert result["afterClose"]["stopped"] >= 1, result
        assert not errors, errors
        await browser.close()
        print("PASS iPhone permission transition keeps camera stream open")
        print("PASS pagehide does not terminate an approved camera stream")
        print("PASS closing the scanner stops camera tracks")
        print("PASSED 3/3 camera lifecycle checks")


if __name__ == "__main__":
    asyncio.run(main())
