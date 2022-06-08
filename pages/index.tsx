import React, { useContext, useEffect } from "react";
import dynamic from "next/dynamic";
import NavBar from "../src/components/NavBar";

function index() {
  const T = dynamic(() => import("../src/t"), {
    ssr: false,
  });

  return (
    <>
      <NavBar />
      <div className="flex justify-center mt-10 w-full h-full flex-col ">
        <T />
      </div>
    </>
  );
}

export default index;
