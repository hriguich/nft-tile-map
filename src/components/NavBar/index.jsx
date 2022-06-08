import { useRouter } from "next/router";
import React from "react";

function NavBar() {
  const router = useRouter();

  return (
    <div className="bg-[#252A34] text-[#eaeaea] h-14 shadow-xl sticky">
      <div className="flex items-center h-full space-x-5">
        <p
          className="ml-5 font-bold cursor-pointer"
          onClick={() => {
            router.push("/");
          }}
        >
          Homepage
        </p>
      </div>
    </div>
  );
}

export default NavBar;
