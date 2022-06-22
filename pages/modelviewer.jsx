import React, { useEffect, useState } from "react";
import NavBar from "../src/components/NavBar";
import Script from "next/script";
import { useRouter } from "next/router";

function Modelviewer() {
  const router = useRouter();
  const [path, setPath] = useState(null);

  useEffect(() => {
    if (router.query.model) {
      setPath(router.query.model);
    }
  }, [router]);

  useEffect(() => {
    console.log(path);
  }, [path]);

  return (
    <div className="overflow-x-hidden">
      <NavBar />
      <div className="w-screen h-[84vh] md:h-screen flex justify-center ">
        <Script
          type="module"
          src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
          strategy="afterInteractive"
        ></Script>
        <div className="w-full h-full ">
          {path && (
            <model-viewer
              style={{ width: "100%", height: "100%" }}
              alt="nft glb"
              src={`models/${path}`}
              ar
              ar-modes="webxr scene-viewer quick-look"
              poster={`models/${path}`}
              seamless-poster
              shadow-intensity="2"
              exposure="0.2"
              camera-controls
              environment-image="whipple_creek_regional_park_04_1k.hdr"
              enable-pan
            ></model-viewer>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modelviewer;
