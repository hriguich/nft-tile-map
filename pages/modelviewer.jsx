import React, { useEffect, useState } from "react";
import NavBar from "../src/components/NavBar";
import Script from "next/script";
import { useRouter } from "next/router";

const urls = ["Executiveplot_2.glb"];

function Modelviewer() {
  const router = useRouter();
  const [type, setType] = useState(null);

  useEffect(() => {
    if (router.query.type) {
      setType(router.query.type);
    }
  }, [router]);

  const getGlbUrl = (type) => {
    let arrayIndex = type - 1;
    const url = urls[arrayIndex];
    return url;
  };

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
          {type && (
            <model-viewer
              style={{ width: "100%", height: "100%" }}
              alt="nft glb"
              src={getGlbUrl(type)}
              ar
              ar-modes="webxr scene-viewer quick-look"
              poster={getGlbUrl(type)}
              seamless-poster
              shadow-intensity="1"
              camera-controls
              enable-pan
            ></model-viewer>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modelviewer;
