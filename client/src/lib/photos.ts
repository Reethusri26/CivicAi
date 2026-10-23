// Photos in /public/images, all from Wikimedia Commons under free licences.
// CC BY / CC BY-SA images must be credited; see PhotoCredits in the footer.

export interface Photo {
  src: string;
  alt: string;
  credit: string;
  license: string;
  source: string;
}

const COMMONS = "https://commons.wikimedia.org/wiki/File:";

export const PHOTOS = {
  pothole: {
    src: "/images/pothole-640.webp",
    alt: "A deep, water-filled pothole in an asphalt street",
    credit: "Miguel Tremblay",
    license: "Public domain",
    source: `${COMMONS}Pothole_in_Villeray,_Montr%C3%A9al.jpg`,
  },
  garbage: {
    src: "/images/garbage-640.webp",
    alt: "Garbage piled at the roadside next to a wall, with a goat searching through it",
    credit: "McKay Savage",
    license: "CC BY 2.0",
    source: `${COMMONS}India_-_Sights_%26_Culture_-_Common_garbage_dump_outside_a_temple_(2566331277).jpg`,
  },
  waterLeak: {
    src: "/images/water-leak-640.webp",
    alt: "Water spraying from a burst pipe across open ground",
    credit: "Yuri Samoylov",
    license: "CC BY-SA 4.0",
    source: `${COMMONS}2024-12-25_Leaking_pipe_in_Lisi_Park.jpg`,
  },
  streetLights: {
    src: "/images/street-lights.webp",
    alt: "A city road at night lit by street lamps, with light trails from traffic",
    credit: "Exploringlife",
    license: "CC BY-SA 4.0",
    source: `${COMMONS}Granville_Road_at_night.jpg`,
  },
  waterlogging: {
    src: "/images/waterlogging-640.webp",
    alt: "A man in a high-visibility vest wading through a waterlogged street in Kolkata",
    credit: "Sumita Roy Dutta",
    license: "CC BY-SA 4.0",
    source: `${COMMONS}Torrential_rain_lash_Kolkata,_many_areas_waterlogged-_Kolkata-West_Bengal-September_2021-IMG_20210915_205028.jpg`,
  },
  roadCrew: {
    src: "/images/road-crew.webp",
    alt: "A road worker in a high-visibility vest cutting asphalt with a power saw",
    credit: "Senior Airman Dennis Sloan, U.S. Air Force",
    license: "Public domain",
    source: `${COMMONS}Civil_engineer_squadrons_team_up,_repave_road_140910-F-LR006-113.jpg`,
  },
  cityNight: {
    src: "/images/city-night.webp",
    alt: "A busy multi-lane city road at night between tall buildings",
    credit: "Exploringlife",
    license: "CC BY-SA 4.0",
    source: `${COMMONS}Chatham_Road_North_at_night.JPG`,
  },
} satisfies Record<string, Photo>;
