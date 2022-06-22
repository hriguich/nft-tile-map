import React, { useEffect, useState } from "react";
import { TileMap, Layer } from "./index";
import { useRouter } from "../node_modules/next/router";

const T = () => {
  const router = useRouter();
  const [atlas, setAtlas] = useState(null);
  const [selectedTile, setSelectedTile] = useState<SelectedTile>({
    tiles: null,
    tileInfo: {},
    coords: null,
  });
  // const [hover, setHover] = useState({ x: 0, y: 0 });
  // const isPositive = (x: number, y: number) => x > 0 && y > 0;

  // // const positiveLayer: Layer = (x, y) => {
  // //   return {
  // //     color: isPositive(x, y) ? "#cccccc" : "#888888",
  // //   };
  // // };

  // // const hoverLayer: Layer = (x, y) => {
  // //   return hover.x === x && hover.y === y
  // //     ? { color: isPositive(x, y) ? "#ff0000" : "#00ff00" }
  // //     : null;
  // // };

  useEffect(() => {
    if (router.query.landid && atlas) {
      if (Number(router.query.landid) <= 7000) {
        const asArray = Object.entries(atlas);
        const filtered = asArray.filter(([key, value]) => {
          const i = value as any;
          return i.landId == router.query.landid;
        });

        const tiles = Object.fromEntries(filtered);

        let coords;

        const firstCoord = Object.values(tiles)[0] as any;
        const x1 = firstCoord.x;
        const y1 = firstCoord.y;

        if (Object.keys(tiles).length === 1) {
          coords = `(${x1},${y1})`;
        } else if (Object.keys(tiles).length > 1) {
          const lastCoord = Object.values(tiles)[
            Object.keys(tiles).length - 1
          ] as any;
          const x2 = lastCoord.x;
          const y2 = lastCoord.y;

          coords = `(${x1},${y1}) : (${x2},${y2})`;
        }

        console.log(tiles);
        const tile = atlas[`${x1},${y1}`];

        const color = COLOR_BY_TYPE[tile.type];
        const top = !!tile.top;
        const left = !!tile.left;
        const topLeft = !!tile.topLeft;
        const owner = tile.owner;
        const type = tile.type;
        const estateId = tile.estate_id;
        const image = tile.image;
        const price = tile.price;
        const landId = tile.landId;
        const zone = tile.zone;
        const isHighTraffic = tile.isHighTraffic;
        const billboard = tile.billboard;
        const modelPath = tile["3dfile"];
        const riverFront = tile.riverfront;

        const tileInfo = {
          color,
          top,
          left,
          topLeft,
          owner,
          type,
          estateId,
          price,
          landId,
          zone,
          isHighTraffic,
          billboard,
          modelPath,
          riverFront,
        };

        setSelectedTile({ tiles, tileInfo, coords, x: x1, y: y1 });
      }
    } else if (!router.query.landid && atlas) {
      setSelectedTile({ tiles: {}, tileInfo: {}, coords: null });
    }
  }, [router, atlas]);

  type SelectedTile = {
    tiles;
    tileInfo;
    coords;
    x?;
    y?;
  };

  type AtlasTile = {
    x: number;
    y: number;
    type: number;
    district_id?: number;
    estate_id?: number;
    left?: number;
    top?: number;
    topLeft?: number;
    price?: number;
    owner?: string;
    image?: string;
    landId?: number;
    zone?: number;
    isHighTraffic?: boolean;
    billboard?: string;
  };

  // let atlas: Record<string, AtlasTile> | null = null;

  async function loadTiles() {
    var requestOptions = {
      method: "POST",
    };

    const res = fetch("https://api.notiondrop.io/map", requestOptions)
      .then((response) => response.text())
      .then((result) => {
        console.log(JSON.parse(result));
        return JSON.parse(result);
      })
      .catch((error) => console.log("error", error));

    const config = require("../data.json");
    // const resp = await fetch("https://api.decentraland.org/v1/tiles");
    const json = await res;
    console.log(json.data);
    setAtlas(json.data);
  }

  useEffect(() => {
    if (atlas === null) {
      loadTiles().catch(console.error);
    }
  }, []);

  const COLOR_BY_TYPE = Object.freeze({
    1: "#B4D6C1", // standard
    2: "#8DC3A7", // deluxe
    3: "#6BAF92", // villa
    4: "#4E9C81", // ex
    5: "#0000FF", //shop
    6: "#1D5171", //beach
    7: "#1D5171", //beach
    8: "#1D5171", //beach
    9: "#1D5171", //beach
    10: "#47484C", //roads
    11: "#15B2D1", // river
    12: "#65CBDA", // river
    13: "#C2B280", // sand
    999: "#013220", // background
  });

  const STRING_TYPE = Object.freeze({
    1: "Standard", // standard
    2: "Deluxe", // deluxe
    3: "Villa", // villa
    4: "Executive", // ex
    5: "Shop", //shop
    6: "Beach", //beach
    7: "Beach", //beach
    8: "Beach", //beach
    9: "Beach", //beach
    10: "Road", //roads
    11: "River", // river
    12: "River", // river
    13: "Sand", // sand
    999: "Background", // background
  });

  const SQUARE_BY_TYPE = Object.freeze({
    1: 729, // standard
    2: 4374, // deluxe
    3: 14580, // villa
    4: 30618, // ex
    5: 14580, //shop
    6: 30618, //beach
    7: 4374, //beach
    8: 729, //beach
    9: 14580, //beach
    10: 0, //roads
    11: 0, // river
    12: 0, // river
    13: 0, // sand
    999: 0, // background
  });

  let selected = [];

  // useEffect(() => {
  //   console.log(context);
  // }, [context]);

  function isSelected(x: number, y: number) {
    return selectedTile?.tiles?.some((coord) => coord.x === x && coord.y === y);
  }

  const atlasLayer: Layer = (x, y) => {
    const id = x + "," + y;
    if (atlas !== null && id in atlas) {
      const tile = atlas[id];
      let color;
      // console.log(selectedTile?.tiles[id]);

      if (selectedTile?.tiles[id]) {
        color = "#ff9990";
      } else {
        color = COLOR_BY_TYPE[tile.type];
      }

      const top = !!tile.top;
      const left = !!tile.left;
      const topLeft = !!tile.topLeft;
      const owner = tile.owner;
      const type = tile.type;
      const estateId = tile.estate_id;
      const image = tile.image;
      const price = tile.price;
      const landId = tile.landId;
      const zone = tile.zone;
      const isHighTraffic = tile.isHighTraffic;
      const billboard = tile.billboard;
      const modelPath = tile["3dfile"];
      const riverFront = tile.riverfront;

      return {
        color,
        top,
        left,
        topLeft,
        owner,
        type,
        estateId,
        price,
        landId,
        zone,
        isHighTraffic,
        billboard,
        modelPath,
        riverFront,
      };
    } else {
      return {
        color: (x + y) % 2 === 0 ? COLOR_BY_TYPE[999] : COLOR_BY_TYPE[999],
        type: 999,
      };
    }
  };
  const imagesLayer: Layer = (x, y) => {
    const id = x + "," + y;
    if (atlas !== null && id in atlas) {
      const tile = atlas[id];
      if (tile.image) {
        const color = COLOR_BY_TYPE[tile.type];

        const top = !!tile.top;
        const left = !!tile.left;
        const topLeft = !!tile.topLeft;
        const owner = tile.owner;
        const type = tile.type;
        const estateId = tile.estate_id;
        const image = tile.image;
        const price = tile.price;
        const landId = tile.landId;
        const zone = tile.zone;
        const isHighTraffic = tile.isHighTraffic;
        const billboard = tile.billboard;

        return {
          color,
          top,
          left,
          topLeft,
          owner,
          type,
          estateId,
          image,
          price,
          landId,
          zone,
          isHighTraffic,
          billboard,
        };
      }
    }
  };

  const onSaleLayer: Layer = (x, y) => {
    const id = x + "," + y;
    if (atlas && id in atlas && atlas[id].price) {
      const color = "#00d3ff";
      const top = !!atlas[id].top;
      const left = !!atlas[id].left;
      const topLeft = !!atlas[id].topLeft;
      return {
        color,
        top,
        left,
        topLeft,
      };
    }
    return null;
  };

  const selectedStrokeLayer: Layer = (x, y) => {
    return isSelected(x, y) ? { color: "#ff0044", scale: 1.4 } : null;
  };

  const selectedFillLayer: Layer = (x, y) => {
    // console.log("re");
    return isSelected(x, y) ? { color: "#ff9990", scale: 1.4 } : null;
  };
  return (
    <>
      {selectedTile.tiles ? (
        <div className="flex flex-col items-center ">
          <div
            className=" rounded-xl overflow-hidden drop-shadow-xl "
            style={{ width: "90vw", height: "65vh" }}
          >
            <TileMap
              className="atlas"
              x={
                Object.keys(selectedTile?.tiles).length != 0
                  ? selectedTile.x
                  : 0
              }
              y={
                Object.keys(selectedTile?.tiles).length != 0
                  ? selectedTile.y
                  : 0
              }
              layers={[
                atlasLayer,
                onSaleLayer,
                imagesLayer,
                // selectedStrokeLayer,
                // selectedFillLayer,
                // hoverLayer,
              ]}
              onClick={(tiles, tileInfo, x, y, title) => {
                console.log(x, y, selectedTile);
                if (selectedTile?.tiles[`${x},${y}`]) {
                  setSelectedTile({ tiles: {}, tileInfo: {}, coords: null });
                } else {
                  let coords;
                  if (title) {
                    coords = title;
                    setSelectedTile({ tiles, tileInfo, coords });
                  } else {
                    if (Object.keys(tiles).length === 1) {
                      const firstCoord = Object.values(tiles)[0] as any;
                      const x1 = firstCoord.x;
                      const y1 = firstCoord.y;

                      coords = `(${x1},${y1})`;
                    } else if (Object.keys(tiles).length > 1) {
                      const firstCoord = Object.values(tiles)[0] as any;
                      const x1 = firstCoord.x;
                      const y1 = firstCoord.y;

                      const lastCoord = Object.values(tiles)[
                        Object.keys(tiles).length - 1
                      ] as any;
                      const x2 = lastCoord.x;
                      const y2 = lastCoord.y;

                      coords = `(${x1},${y1}) : (${x2},${y2})`;
                    }

                    console.log({ tiles, tileInfo });
                    setSelectedTile({ tiles, tileInfo, coords });
                  }
                }
              }}
              // onHover={(x, y) => setHover({ x, y })}
              onPopup={(state) => {}}
              SQUARE_BY_TYPE={SQUARE_BY_TYPE}
            />
          </div>
          <div className="flex w-[85vw] ">
            <div className=" my-10 w-full bg-white drop-shadow-md rounded-lg">
              {Object.keys(selectedTile?.tiles).length != 0 ? (
                <div className="m-8 flex flex-col md:flex-row justify-between">
                  <div>
                    <span className="text-lg md:text-xl font-semibolds">
                      {selectedTile?.coords && selectedTile?.coords}
                    </span>
                    <span className="flex space-x-2 mt-5">
                      <h2 className="font-semibold">Land id:</h2>

                      <p> {selectedTile?.tileInfo?.landId}</p>
                    </span>
                    <span className="flex space-x-2">
                      <h2 className="font-semibold">owner:</h2>

                      <p> {selectedTile?.tileInfo?.owner}</p>
                    </span>
                    <span className="flex space-x-2 ">
                      <h2 className="font-semibold">Type:</h2>
                      {selectedTile?.tileInfo?.type == 1 &&
                      selectedTile?.tileInfo?.landId == 0 ? (
                        <p> Road</p>
                      ) : (
                        <p> {STRING_TYPE[selectedTile?.tileInfo?.type]}</p>
                      )}
                    </span>
                    <span className="flex space-x-2 ">
                      <h2 className="font-semibold">Square meters:</h2>
                      <p> {SQUARE_BY_TYPE[selectedTile?.tileInfo?.type]}</p>
                    </span>
                    <span className="flex space-x-2 ">
                      <h2 className="font-semibold">Zone:</h2>
                      <p> {selectedTile?.tileInfo?.zone}</p>
                    </span>
                    <span className="flex space-x-2 ">
                      <h2 className="font-semibold">Billboard:</h2>
                      <p> {selectedTile?.tileInfo?.billboard}</p>
                    </span>
                    <span className="flex space-x-2 ">
                      <h2 className="font-semibold">River front:</h2>
                      <p> {selectedTile?.tileInfo?.riverFront}</p>
                    </span>
                    <span className="flex space-x-2 mt-10 ">
                      <ul className="">
                        {selectedTile?.tileInfo?.isHighTraffic ? (
                          <li>
                            <p className="text-red-800 font-semibold border border-red-900 p-2 rounded-xl shadow-lg">
                              High traffic area
                            </p>
                          </li>
                        ) : (
                          ""
                        )}
                      </ul>
                    </span>
                  </div>
                  <div>
                    {selectedTile?.tileInfo?.price && (
                      <span className="flex flex-col justify-center items-center">
                        <h2 className="font-semibold text-lg">Price</h2>
                        <p> {selectedTile?.tileInfo?.price} </p>
                      </span>
                    )}
                    <div
                      onClick={() => {
                        router.replace(
                          `/modelviewer?model=${selectedTile?.tileInfo?.modelPath}`
                        );
                      }}
                      className="cursor-pointer w-full text-center p-2 mt-10 md:mt-6 md:p-3 md:px-16 bg-[#013220] text-white rounded-lg"
                    >
                      <button>Go in</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[#252A34] p-16 text-center font-semibold">
                  Select a Witlink Land to view details
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default T;
