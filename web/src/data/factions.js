const EMBLEMS = {
  helm: '<path fill-rule="evenodd" d="M12 3C15.5 3 18 5.5 18 9V12C18 16.5 15.5 19.5 12 21C8.5 19.5 6 16.5 6 12V9C6 5.5 8.5 3 12 3Z M8.7 10.4H15.3V11.6H8.7Z"/><circle cx="7.4" cy="9.6" r="1"/><circle cx="16.6" cy="9.6" r="1"/>',
  chevrons: '<path d="M12 3.5L21 7.5V9.5L12 5.5L3 9.5V7.5Z"/><path d="M12 9L21 13V15L12 11L3 15V13Z"/><path d="M12 14.5L21 18.5V20.5L12 16.5L3 20.5V18.5Z"/>',
  cog: '<path fill-rule="evenodd" d="M12 5A7 7 0 1 0 12.01 5Z M12 9A3 3 0 1 0 12.01 9Z"/><circle cx="12" cy="12" r="1.1"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M19 12H21M15.5 5.9L16.5 4.2M8.5 5.9L7.5 4.2M5 12H3M8.5 18.1L7.5 19.8M15.5 18.1L16.5 19.8"/>',
  wings: '<path d="M12 9C12 9 8 6.5 4.5 6C2.5 5.7 1.5 6.3 1.5 6.3C1.5 6.3 2 9.5 4.5 12C6.5 14 9.5 14.5 11 13.8C11.8 13.4 12.2 12.3 12 11.5Z"/><path d="M12 9C12 9 16 6.5 19.5 6C21.5 5.7 22.5 6.3 22.5 6.3C22.5 6.3 22 9.5 19.5 12C17.5 14 14.5 14.5 13 13.8C12.2 13.4 11.8 12.3 12 11.5Z"/><path d="M11.3 20.5C11.3 20.5 10.5 18 12 16C13.5 18 12.7 20.5 12.7 20.5C12.7 20.5 12.4 21 12 21C11.6 21 11.3 20.5 11.3 20.5Z"/>',
  spiral: '<path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="M12 12L12 8L16 8L16 15L7 15L7 5"/><circle cx="12" cy="12" r="1.3"/>',
  sunburst: '<path d="M12 2.5L13.1 9.2L16.6 7.4L14.8 10.9L21.5 12L14.8 13.1L16.6 16.6L13.1 14.8L12 21.5L10.9 14.8L7.4 16.6L9.2 13.1L2.5 12L9.2 10.9L7.4 7.4L10.9 9.2Z"/>',
  fangs: '<path d="M4 6H20V9L18 16L16 9L14 15L12 9L10 16L8 9L6 15L4 9Z"/><path d="M5 9Q2 6 4 2Q6 5 6.5 8.5Z"/><path d="M19 9Q22 6 20 2Q18 5 17.5 8.5Z"/>',
  shield: '<path fill-rule="evenodd" d="M12 3L18 5.5V11C18 16 15 19.5 12 21.5C9 19.5 6 16 6 11V5.5Z M11.2 7H12.8V10.3H15.4V13H12.8V17H11.2V13H8.6V10.3H11.2Z"/>',
  crescent: '<path d="M12 2L16 7V17L12 22L8 17V7Z"/>',
  flame: '<path d="M12 21c-4 0-7-2.6-7-6.2 0-4.8 6.5-7 5.5-13.8 3.5 2.2 8 5.5 8 13.8 0 3.6-2.5 6.2-6.5 6.2z"/>',
  trefoil: '<circle cx="12" cy="7" r="4.3"/><circle cx="16.3" cy="14.5" r="4.3"/><circle cx="7.7" cy="14.5" r="4.3"/>',
  bolt: '<path d="M13 2L5 13h5l-1 9 8-11h-5z"/>',
  leaf: '<path d="M12 21c0-8 2-13 8-16 1 8-2 14-8 16z"/><path d="M12 21c0-6-2-10-8-12 0 7 3 11 8 12z"/>',
  knot: '<path fill-rule="evenodd" d="M8 5A4.2 4.2 0 1 0 8.01 5Z M8 4A5.2 5.2 0 1 1 7.99 4Z"/><path fill-rule="evenodd" d="M16 12A4.2 4.2 0 1 0 16.01 12Z M16 11A5.2 5.2 0 1 1 15.99 11Z"/><path fill-rule="evenodd" d="M8 19A4.2 4.2 0 1 0 8.01 19Z M8 18A5.2 5.2 0 1 1 7.99 18Z"/>',
  hammer: '<path d="M5 6L6 4H15L16 6V9L15 11H6L5 9Z"/><path d="M10 11H12.5V20H10Z"/><path d="M7.5 20H15V21.5H7.5Z"/>',
  bones: '<path d="M4.5 5.2A2 2 0 1 1 6.8 8.2L15.8 17.2A2 2 0 1 1 17.2 18.6L18.8 19.5L19.5 18.8L18.6 17.2A2 2 0 1 1 17.2 15.8L8.2 6.8A2 2 0 1 1 5.2 4.5L4.5 5.2Z"/><path d="M19.5 5.2A2 2 0 1 0 17.2 8.2L8.2 17.2A2 2 0 1 0 6.8 18.6L5.2 19.5L4.5 18.8L5.4 17.2A2 2 0 1 0 6.8 15.8L15.8 6.8A2 2 0 1 0 18.8 4.5L19.5 5.2Z"/>',
  anvil: '<path d="M4 9H16L20 10L16 11H4Z"/><path d="M9 11H14V15H9Z"/><path d="M6 17H18V18.5H6Z"/>',
  crown: '<path d="M4 19h16v2H4Z"/><path d="M4 19l-1-9 5 4 4-7 4 7 5-4-1 9z"/>',
  serpent: '<path d="M4 6C4 6 3.7 8.2 5 9.8C6.3 11.4 9 10.5 9 10.5C9 10.5 11 9.5 12 11C13 9.5 15 10.5 15 10.5C15 10.5 17.7 11.4 19 9.8C20.3 8.2 20 6 20 6C20 6 19.6 8 18 8C16.4 8 15.5 6.5 14 6.5C12.8 6.5 12 8 12 8C12 8 11.2 6.5 10 6.5C8.5 6.5 7.6 8 6 8C4.4 8 4 6 4 6Z"/><path d="M4 18C4 18 3.7 15.8 5 14.2C6.3 12.6 9 13.5 9 13.5C9 13.5 11 14.5 12 13C13 14.5 15 13.5 15 13.5C15 13.5 17.7 12.6 19 14.2C20.3 15.8 20 18 20 18C20 18 19.6 16 18 16C16.4 16 15.5 17.5 14 17.5C12.8 17.5 12 16 12 16C12 16 11.2 17.5 10 17.5C8.5 17.5 7.6 16 6 16C4.4 16 4 18 4 18Z"/>',
  eye: '<path fill-rule="evenodd" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z M12 9a3 3 0 1 0 0.01 0Z"/>',
  tower: '<path d="M6 21V9L6 6H8V9H10.5V6H13.5V9H16V6H18V9L18 21Z"/><path d="M10 21V15H14V21Z" fill="#14171a" fill-opacity="0.55"/>',
  claw: '<path d="M7 3C6.3 3 5.7 3.6 5.9 4.4L8.5 15C8.7 15.7 9.6 15.9 10.1 15.3C10.4 15 10.5 14.5 10.4 14.1L8.1 3.9C8 3.4 7.5 3 7 3Z"/><path d="M12 3C11.3 3 10.7 3.6 10.8 4.3L12.5 16C12.6 16.7 13.5 17 14.1 16.4C14.4 16.1 14.5 15.6 14.4 15.2L13.1 3.9C13 3.4 12.5 3 12 3Z"/><path d="M17 3.5C16.3 3.7 15.9 4.4 16.2 5.1L19.4 13.6C19.7 14.3 20.6 14.4 21 13.7C21.2 13.4 21.2 12.9 21 12.5L17.9 4.1C17.7 3.6 17.2 3.3 17 3.5Z"/>',
};

// --- Factions currently in the Games Workshop range ---
const FACTIONS = [
  // Warhammer 40,000 — Imperium
  { id: "space-marines",        label: "Space Marines",        system: "40k", alliance: "Imperium",    color: "#1B4B6B", emblem: "helm" },
  { id: "blood-angels",         label: "Blood Angels",         system: "40k", alliance: "Imperium",    color: "#8E1B24", emblem: "wings" },
  { id: "dark-angels",          label: "Dark Angels",          system: "40k", alliance: "Imperium",    color: "#20452F", emblem: "wings" },
  { id: "space-wolves",         label: "Space Wolves",         system: "40k", alliance: "Imperium",    color: "#6C8794", emblem: "fangs" },
  { id: "black-templars",       label: "Black Templars",       system: "40k", alliance: "Imperium",    color: "#4A4A50", emblem: "shield" },
  { id: "deathwatch",           label: "Deathwatch",           system: "40k", alliance: "Imperium",    color: "#3C3C42", emblem: "bones" },
  { id: "grey-knights",         label: "Grey Knights",         system: "40k", alliance: "Imperium",    color: "#7E8B96", emblem: "tower" },
  { id: "adeptus-custodes",     label: "Adeptus Custodes",     system: "40k", alliance: "Imperium",    color: "#B08A2E", emblem: "crown" },
  { id: "adepta-sororitas",     label: "Adepta Sororitas",     system: "40k", alliance: "Imperium",    color: "#8A1C2B", emblem: "flame" },
  { id: "astra-militarum",      label: "Astra Militarum",      system: "40k", alliance: "Imperium",    color: "#5A6340", emblem: "chevrons" },
  { id: "adeptus-mechanicus",   label: "Adeptus Mechanicus",   system: "40k", alliance: "Imperium",    color: "#9B3B24", emblem: "cog" },
  { id: "imperial-knights",     label: "Imperial Knights",     system: "40k", alliance: "Imperium",    color: "#3F6D8E", emblem: "tower" },
  { id: "imperial-agents",      label: "Imperial Agents",      system: "40k", alliance: "Imperium",    color: "#5C5568", emblem: "eye" },

  // Warhammer 40,000 — Chaos
  { id: "chaos-space-marines",  label: "Chaos Space Marines",  system: "40k", alliance: "Chaos",       color: "#5B2E63", emblem: "sunburst" },
  { id: "death-guard",          label: "Death Guard",          system: "40k", alliance: "Chaos",       color: "#6E7443", emblem: "trefoil" },
  { id: "thousand-sons",        label: "Thousand Sons",        system: "40k", alliance: "Chaos",       color: "#1E6E6B", emblem: "spiral" },
  { id: "world-eaters",         label: "World Eaters",         system: "40k", alliance: "Chaos",       color: "#96222B", emblem: "claw" },
  { id: "emperors-children",    label: "Emperor's Children",   system: "40k", alliance: "Chaos",       color: "#8E3A7E", emblem: "serpent" },
  { id: "chaos-daemons",        label: "Chaos Daemons",        system: "40k", alliance: "Chaos",       color: "#6B2450", emblem: "eye" },
  { id: "chaos-knights",        label: "Chaos Knights",        system: "40k", alliance: "Chaos",       color: "#5A3242", emblem: "tower" },

  // Warhammer 40,000 — Xenos
  { id: "aeldari",              label: "Aeldari",              system: "40k", alliance: "Xenos",       color: "#2E7C86", emblem: "crescent" },
  { id: "drukhari",             label: "Drukhari",             system: "40k", alliance: "Xenos",       color: "#3F5A72", emblem: "claw" },
  { id: "necrons",              label: "Necrons",              system: "40k", alliance: "Xenos",       color: "#4C7A3E", emblem: "bones" },
  { id: "orks",                 label: "Orks",                 system: "40k", alliance: "Xenos",       color: "#5C7A29", emblem: "fangs" },
  { id: "tau-empire",           label: "T'au Empire",          system: "40k", alliance: "Xenos",       color: "#B4642A", emblem: "shield" },
  { id: "tyranids",             label: "Tyranids",             system: "40k", alliance: "Xenos",       color: "#B8542E", emblem: "claw" },
  { id: "genestealer-cults",    label: "Genestealer Cults",    system: "40k", alliance: "Xenos",       color: "#7A5C8E", emblem: "spiral" },
  { id: "leagues-of-votann",    label: "Leagues of Votann",    system: "40k", alliance: "Xenos",       color: "#B08A2E", emblem: "anvil" },

  // Age of Sigmar — Order
  { id: "stormcast-eternals",   label: "Stormcast Eternals",   system: "aos", alliance: "Order",       color: "#B0912F", emblem: "bolt" },
  { id: "cities-of-sigmar",     label: "Cities of Sigmar",     system: "aos", alliance: "Order",       color: "#6A5B8C", emblem: "tower" },
  { id: "daughters-of-khaine",  label: "Daughters of Khaine",  system: "aos", alliance: "Order",       color: "#8E2340", emblem: "crescent" },
  { id: "fyreslayers",          label: "Fyreslayers",          system: "aos", alliance: "Order",       color: "#C05A22", emblem: "flame" },
  { id: "idoneth-deepkin",      label: "Idoneth Deepkin",      system: "aos", alliance: "Order",       color: "#2E7C86", emblem: "spiral" },
  { id: "kharadron-overlords",  label: "Kharadron Overlords",  system: "aos", alliance: "Order",       color: "#9A7B2E", emblem: "cog" },
  { id: "lumineth-realm-lords", label: "Lumineth Realm-lords", system: "aos", alliance: "Order",       color: "#C2A33F", emblem: "sunburst" },
  { id: "seraphon",             label: "Seraphon",             system: "aos", alliance: "Order",       color: "#2F6F4E", emblem: "sunburst" },
  { id: "sylvaneth",            label: "Sylvaneth",            system: "aos", alliance: "Order",       color: "#4C7A3E", emblem: "leaf" },

  // Age of Sigmar — Chaos
  { id: "blades-of-khorne",     label: "Blades of Khorne",     system: "aos", alliance: "Chaos",       color: "#96222B", emblem: "hammer" },
  { id: "disciples-of-tzeentch",label: "Disciples of Tzeentch",system: "aos", alliance: "Chaos",       color: "#1E6E6B", emblem: "eye" },
  { id: "maggotkin-of-nurgle",  label: "Maggotkin of Nurgle",  system: "aos", alliance: "Chaos",       color: "#6E7443", emblem: "trefoil" },
  { id: "hedonites-of-slaanesh",label: "Hedonites of Slaanesh",system: "aos", alliance: "Chaos",       color: "#8E3A7E", emblem: "serpent" },
  { id: "skaven",               label: "Skaven",               system: "aos", alliance: "Chaos",       color: "#7A6A3E", emblem: "fangs" },
  { id: "slaves-to-darkness",   label: "Slaves to Darkness",   system: "aos", alliance: "Chaos",       color: "#5A3242", emblem: "sunburst" },

  // Age of Sigmar — Death
  { id: "flesh-eater-courts",   label: "Flesh-eater Courts",   system: "aos", alliance: "Death",       color: "#7E5A3C", emblem: "crown" },
  { id: "nighthaunt",           label: "Nighthaunt",           system: "aos", alliance: "Death",       color: "#3E7E76", emblem: "knot" },
  { id: "ossiarch-bonereapers", label: "Ossiarch Bonereapers", system: "aos", alliance: "Death",       color: "#8A8256", emblem: "bones" },
  { id: "soulblight-gravelords",label: "Soulblight Gravelords",system: "aos", alliance: "Death",       color: "#7A2130", emblem: "bones" },

  // Age of Sigmar — Destruction
  { id: "gloomspite-gitz",      label: "Gloomspite Gitz",      system: "aos", alliance: "Destruction", color: "#3E7E5E", emblem: "crescent" },
  { id: "ogor-mawtribes",       label: "Ogor Mawtribes",       system: "aos", alliance: "Destruction", color: "#8A6A3E", emblem: "fangs" },
  { id: "orruk-warclans",       label: "Orruk Warclans",       system: "aos", alliance: "Destruction", color: "#5C7A29", emblem: "hammer" },
  { id: "sons-of-behemat",      label: "Sons of Behemat",      system: "aos", alliance: "Destruction", color: "#7A6A4E", emblem: "anvil" },

  // Necromunda -- gang ids are namespaced (nec-) since a couple of labels
  // ("House Cawdor" etc.) are unique already, but this keeps every non-40k/
  // AoS system's ids visually grouped and collision-proof the same way.
  { id: "nec-escher",       label: "House Escher",             system: "necromunda", alliance: "House Gangs",              color: "#8E3A6E", emblem: "serpent" },
  { id: "nec-goliath",      label: "House Goliath",            system: "necromunda", alliance: "House Gangs",              color: "#B0472E", emblem: "hammer" },
  { id: "nec-orlock",       label: "House Orlock",             system: "necromunda", alliance: "House Gangs",              color: "#4F5A63", emblem: "cog" },
  { id: "nec-van-saar",     label: "House Van Saar",           system: "necromunda", alliance: "House Gangs",              color: "#2E8A7E", emblem: "bolt" },
  { id: "nec-cawdor",       label: "House Cawdor",             system: "necromunda", alliance: "House Gangs",              color: "#6B2A24", emblem: "flame" },
  { id: "nec-delaque",      label: "House Delaque",            system: "necromunda", alliance: "House Gangs",              color: "#4A3D6B", emblem: "eye" },
  { id: "nec-enforcers",    label: "Palanite Enforcers",       system: "necromunda", alliance: "Law Enforcement",          color: "#3F6D8E", emblem: "shield" },
  { id: "nec-helot-cult",   label: "Chaos Helot Cults",        system: "necromunda", alliance: "Cults & Heretics",         color: "#6B2450", emblem: "sunburst" },
  { id: "nec-gsc",          label: "Genestealer Cults",        system: "necromunda", alliance: "Cults & Heretics",         color: "#7A5C8E", emblem: "spiral" },
  { id: "nec-corpse-grinder",label:"Corpse Grinder Cults",      system: "necromunda", alliance: "Cults & Heretics",         color: "#8A1C2B", emblem: "claw" },
  { id: "nec-malstrain",    label: "Malstrain Gangs",          system: "necromunda", alliance: "Cults & Heretics",         color: "#5A6340", emblem: "trefoil" },
  { id: "nec-venators",     label: "Venators",                 system: "necromunda", alliance: "Outlanders & Specialists", color: "#B08A2E", emblem: "chevrons" },
  { id: "nec-outcasts",     label: "Underhive Outcasts",       system: "necromunda", alliance: "Outlanders & Specialists", color: "#5C5568", emblem: "knot" },
  { id: "nec-ogryns",       label: "Slave Ogryns",             system: "necromunda", alliance: "Outlanders & Specialists", color: "#7E5A3C", emblem: "fangs" },
  { id: "nec-ash-wastes",   label: "Ash Waste Nomads",         system: "necromunda", alliance: "Outlanders & Specialists", color: "#9B7B4E", emblem: "wings" },
  { id: "nec-prospectors",  label: "Ironhead Squat Prospectors",system: "necromunda", alliance: "Outlanders & Specialists", color: "#8A6A3E", emblem: "anvil" },

  // Warhammer: The Old World -- historical fantasy, distinct from Age of
  // Sigmar. No official grouping exists in GW's own branding; the alliance
  // labels below are this app's own organizational convenience, same as
  // every other system's alliance labels are really just a browse-grid
  // convenience rather than a strict rules concept.
  { id: "ow-empire",        label: "Empire of Man",            system: "old-world", alliance: "Kingdoms of Men",     color: "#3F6D8E", emblem: "sunburst" },
  { id: "ow-bretonnia",     label: "Kingdom of Bretonnia",     system: "old-world", alliance: "Kingdoms of Men",     color: "#B0912F", emblem: "shield" },
  { id: "ow-cathay",        label: "Grand Cathay",             system: "old-world", alliance: "Kingdoms of Men",     color: "#8A1C2B", emblem: "serpent" },
  { id: "ow-renegade",      label: "Renegade Crowns",          system: "old-world", alliance: "Kingdoms of Men",     color: "#5A3242", emblem: "bones" },
  { id: "ow-high-elves",    label: "High Elf Realms",          system: "old-world", alliance: "Elves",               color: "#C2A33F", emblem: "wings" },
  { id: "ow-wood-elves",    label: "Wood Elf Realms",          system: "old-world", alliance: "Elves",               color: "#4C7A3E", emblem: "leaf" },
  { id: "ow-dark-elves",    label: "Dark Elves",               system: "old-world", alliance: "Elves",               color: "#5C2E63", emblem: "crescent" },
  { id: "ow-dwarfs",        label: "Dwarfen Mountain Holds",   system: "old-world", alliance: "Dwarfs & Greenskins", color: "#B08A2E", emblem: "hammer" },
  { id: "ow-chaos-dwarfs",  label: "Chaos Dwarfs",             system: "old-world", alliance: "Dwarfs & Greenskins", color: "#6E7443", emblem: "anvil" },
  { id: "ow-orcs-goblins",  label: "Orc & Goblin Tribes",      system: "old-world", alliance: "Dwarfs & Greenskins", color: "#5C7A29", emblem: "fangs" },
  { id: "ow-beastmen",      label: "Beastmen Brayherds",       system: "old-world", alliance: "Dwarfs & Greenskins", color: "#7A5C3C", emblem: "helm" },
  { id: "ow-chaos-warriors",label: "Warriors of Chaos",        system: "old-world", alliance: "Chaos & Undead",      color: "#5B2E63", emblem: "sunburst" },
  { id: "ow-tomb-kings",    label: "Tomb Kings of Khemri",     system: "old-world", alliance: "Chaos & Undead",      color: "#8A8256", emblem: "bones" },
  { id: "ow-vampire-counts",label: "Vampire Counts",           system: "old-world", alliance: "Chaos & Undead",      color: "#7A2130", emblem: "knot" },
  { id: "ow-daemons",       label: "Daemons of Chaos",         system: "old-world", alliance: "Chaos & Undead",      color: "#6B2450", emblem: "eye" },
  { id: "ow-skaven",        label: "Skaven",                   system: "old-world", alliance: "Chaos & Undead",      color: "#7A6A3E", emblem: "claw" },
  { id: "ow-ogre-kingdoms", label: "Ogre Kingdoms",            system: "old-world", alliance: "Chaos & Undead",      color: "#8A6A3E", emblem: "chevrons" },
  { id: "ow-lizardmen",     label: "Lizardmen",                system: "old-world", alliance: "Chaos & Undead",      color: "#2F6F4E", emblem: "spiral" },

  // Horus Heresy / Age of Darkness -- ids namespaced (hh-) since several
  // Legion names ("Blood Angels", "Dark Angels", "Space Wolves") would
  // otherwise collide with their 40k-era faction ids above. Same legion,
  // different era of this app's timeline -- the label repeats on purpose.
  { id: "hh-dark-angels",   label: "Dark Angels",              system: "horus-heresy", alliance: "Loyalist Legions", color: "#20452F", emblem: "wings" },
  { id: "hh-white-scars",   label: "White Scars",              system: "horus-heresy", alliance: "Loyalist Legions", color: "#7E8B96", emblem: "chevrons" },
  { id: "hh-space-wolves",  label: "Space Wolves",             system: "horus-heresy", alliance: "Loyalist Legions", color: "#6C8794", emblem: "fangs" },
  { id: "hh-imperial-fists",label: "Imperial Fists",           system: "horus-heresy", alliance: "Loyalist Legions", color: "#B08A2E", emblem: "tower" },
  { id: "hh-blood-angels",  label: "Blood Angels",             system: "horus-heresy", alliance: "Loyalist Legions", color: "#8E1B24", emblem: "wings" },
  { id: "hh-iron-hands",    label: "Iron Hands",               system: "horus-heresy", alliance: "Loyalist Legions", color: "#4A4A50", emblem: "cog" },
  { id: "hh-ultramarines",  label: "Ultramarines",             system: "horus-heresy", alliance: "Loyalist Legions", color: "#1B4B6B", emblem: "helm" },
  { id: "hh-salamanders",   label: "Salamanders",              system: "horus-heresy", alliance: "Loyalist Legions", color: "#2F6F4E", emblem: "flame" },
  { id: "hh-raven-guard",   label: "Raven Guard",              system: "horus-heresy", alliance: "Loyalist Legions", color: "#3C3C42", emblem: "wings" },
  { id: "hh-emperors-children",label:"Emperor's Children",     system: "horus-heresy", alliance: "Traitor Legions",  color: "#8E3A7E", emblem: "serpent" },
  { id: "hh-iron-warriors", label: "Iron Warriors",             system: "horus-heresy", alliance: "Traitor Legions",  color: "#5A6340", emblem: "tower" },
  { id: "hh-night-lords",   label: "Night Lords",              system: "horus-heresy", alliance: "Traitor Legions",  color: "#3C3C42", emblem: "bones" },
  { id: "hh-world-eaters",  label: "World Eaters",             system: "horus-heresy", alliance: "Traitor Legions",  color: "#96222B", emblem: "claw" },
  { id: "hh-death-guard",   label: "Death Guard",              system: "horus-heresy", alliance: "Traitor Legions",  color: "#6E7443", emblem: "trefoil" },
  { id: "hh-thousand-sons", label: "Thousand Sons",             system: "horus-heresy", alliance: "Traitor Legions",  color: "#1E6E6B", emblem: "spiral" },
  { id: "hh-sons-of-horus", label: "Sons of Horus",             system: "horus-heresy", alliance: "Traitor Legions",  color: "#5A3242", emblem: "eye" },
  { id: "hh-word-bearers",  label: "Word Bearers",              system: "horus-heresy", alliance: "Traitor Legions",  color: "#6B2450", emblem: "sunburst" },
  { id: "hh-alpha-legion",  label: "Alpha Legion",              system: "horus-heresy", alliance: "Traitor Legions",  color: "#2E7C86", emblem: "crescent" },
  { id: "hh-solar-auxilia", label: "Solar Auxilia",             system: "horus-heresy", alliance: "Imperial Auxilia", color: "#5A6340", emblem: "chevrons" },
  { id: "hh-militia",       label: "Imperialis Militia",        system: "horus-heresy", alliance: "Imperial Auxilia", color: "#6B6560", emblem: "knot" },
  { id: "hh-mechanicum",    label: "Mechanicum",                system: "horus-heresy", alliance: "Mechanicum & Custodes", color: "#9B3B24", emblem: "cog" },
  { id: "hh-talons",        label: "Talons of the Emperor",     system: "horus-heresy", alliance: "Mechanicum & Custodes", color: "#B08A2E", emblem: "crown" },

  // Blood Bowl -- teams, not armies, but expressed in the identical shape
  // so the browse grid/recipe form need no special-casing. Ids namespaced
  // (bb-) since several labels ("Human", "Skaven", "Vampire") would
  // otherwise collide with 40k/AoS/Old World ids above.
  { id: "bb-human",         label: "Human",                    system: "blood-bowl", alliance: "Old World & Civilised", color: "#3F6D8E", emblem: "chevrons" },
  { id: "bb-dwarf",         label: "Dwarf",                    system: "blood-bowl", alliance: "Old World & Civilised", color: "#B08A2E", emblem: "hammer" },
  { id: "bb-halfling",      label: "Halfling",                 system: "blood-bowl", alliance: "Old World & Civilised", color: "#8A6A3E", emblem: "leaf" },
  { id: "bb-high-elf",      label: "High Elf",                 system: "blood-bowl", alliance: "Old World & Civilised", color: "#C2A33F", emblem: "wings" },
  { id: "bb-dark-elf",      label: "Dark Elf",                  system: "blood-bowl", alliance: "Old World & Civilised", color: "#5C2E63", emblem: "crescent" },
  { id: "bb-wood-elf",      label: "Wood Elf",                  system: "blood-bowl", alliance: "Old World & Civilised", color: "#4C7A3E", emblem: "leaf" },
  { id: "bb-elven-union",   label: "Elven Union",               system: "blood-bowl", alliance: "Old World & Civilised", color: "#2E7C86", emblem: "sunburst" },
  { id: "bb-owa",           label: "Old World Alliance",        system: "blood-bowl", alliance: "Old World & Civilised", color: "#7E8B96", emblem: "shield" },
  { id: "bb-imperial-nobility",label:"Imperial Nobility",       system: "blood-bowl", alliance: "Old World & Civilised", color: "#9B7B2E", emblem: "crown" },
  { id: "bb-bretonnian",    label: "Bretonnian",                system: "blood-bowl", alliance: "Old World & Civilised", color: "#B0912F", emblem: "tower" },
  { id: "bb-amazon",        label: "Amazon",                    system: "blood-bowl", alliance: "Old World & Civilised", color: "#3E7E5E", emblem: "spiral" },
  { id: "bb-norse",         label: "Norse",                     system: "blood-bowl", alliance: "Old World & Civilised", color: "#6C8794", emblem: "bolt" },
  { id: "bb-gnome",         label: "Gnome",                     system: "blood-bowl", alliance: "Old World & Civilised", color: "#7A6A4E", emblem: "cog" },
  { id: "bb-orc",           label: "Orc",                       system: "blood-bowl", alliance: "Greenskin & Monstrous", color: "#5C7A29", emblem: "fangs" },
  { id: "bb-black-orc",     label: "Black Orc",                 system: "blood-bowl", alliance: "Greenskin & Monstrous", color: "#3C4A22", emblem: "hammer" },
  { id: "bb-goblin",        label: "Goblin",                    system: "blood-bowl", alliance: "Greenskin & Monstrous", color: "#6B7A2E", emblem: "crescent" },
  { id: "bb-snotling",      label: "Snotling",                  system: "blood-bowl", alliance: "Greenskin & Monstrous", color: "#7A8A3E", emblem: "leaf" },
  { id: "bb-ogre",          label: "Ogre",                      system: "blood-bowl", alliance: "Greenskin & Monstrous", color: "#8A6A3E", emblem: "anvil" },
  { id: "bb-chaos-dwarf",   label: "Chaos Dwarf",               system: "blood-bowl", alliance: "Greenskin & Monstrous", color: "#6E7443", emblem: "cog" },
  { id: "bb-chaos-chosen",  label: "Chaos Chosen",              system: "blood-bowl", alliance: "Chaos & Evil",         color: "#5B2E63", emblem: "sunburst" },
  { id: "bb-chaos-renegades",label:"Chaos Renegades",          system: "blood-bowl", alliance: "Chaos & Evil",         color: "#6B2450", emblem: "eye" },
  { id: "bb-khorne",        label: "Khorne",                    system: "blood-bowl", alliance: "Chaos & Evil",         color: "#96222B", emblem: "claw" },
  { id: "bb-nurgle",        label: "Nurgle",                    system: "blood-bowl", alliance: "Chaos & Evil",         color: "#6E7443", emblem: "trefoil" },
  { id: "bb-vampire",       label: "Vampire",                   system: "blood-bowl", alliance: "Undead",              color: "#7A2130", emblem: "bones" },
  { id: "bb-necromantic",   label: "Necromantic Horror",        system: "blood-bowl", alliance: "Undead",              color: "#5A3242", emblem: "knot" },
  { id: "bb-shambling-undead",label:"Shambling Undead",         system: "blood-bowl", alliance: "Undead",              color: "#4A4A50", emblem: "bones" },
  { id: "bb-tomb-kings",    label: "Tomb Kings",                system: "blood-bowl", alliance: "Undead",              color: "#8A8256", emblem: "sunburst" },
  { id: "bb-skaven",        label: "Skaven",                    system: "blood-bowl", alliance: "Underworld & Reptile", color: "#7A6A3E", emblem: "fangs" },
  { id: "bb-underworld",    label: "Underworld Denizens",       system: "blood-bowl", alliance: "Underworld & Reptile", color: "#3E7E76", emblem: "spiral" },
  { id: "bb-lizardmen",     label: "Lizardmen",                 system: "blood-bowl", alliance: "Underworld & Reptile", color: "#2F6F4E", emblem: "claw" },

  // Kill Team -- specific team names, a level more granular than a full
  // 40k army, but expressed the same way. Ids namespaced (kt-) throughout.
  { id: "kt-angels-of-death",label: "Angels of Death",          system: "kill-team", alliance: "Imperium", color: "#1B4B6B", emblem: "helm" },
  { id: "kt-battleclade",   label: "Battleclade",               system: "kill-team", alliance: "Imperium", color: "#9B3B24", emblem: "cog" },
  { id: "kt-celestian-insidiants",label:"Celestian Insidiants", system: "kill-team", alliance: "Imperium", color: "#8A1C2B", emblem: "flame" },
  { id: "kt-death-korps",   label: "Death Korps",               system: "kill-team", alliance: "Imperium", color: "#5A6340", emblem: "chevrons" },
  { id: "kt-deathwatch",    label: "Deathwatch",                system: "kill-team", alliance: "Imperium", color: "#3C3C42", emblem: "bones" },
  { id: "kt-elucidian",     label: "Elucidian Starstriders",    system: "kill-team", alliance: "Imperium", color: "#3F6D8E", emblem: "sunburst" },
  { id: "kt-exaction-squad",label: "Exaction Squad",            system: "kill-team", alliance: "Imperium", color: "#5C5568", emblem: "eye" },
  { id: "kt-hunter-clade",  label: "Hunter Clade",               system: "kill-team", alliance: "Imperium", color: "#9B3B24", emblem: "spiral" },
  { id: "kt-navy-breachers",label: "Imperial Navy Breachers",   system: "kill-team", alliance: "Imperium", color: "#5A6340", emblem: "shield" },
  { id: "kt-inquisitorial", label: "Inquisitorial Agents",      system: "kill-team", alliance: "Imperium", color: "#5C5568", emblem: "crown" },
  { id: "kt-kasrkin",       label: "Kasrkin",                   system: "kill-team", alliance: "Imperium", color: "#5A6340", emblem: "tower" },
  { id: "kt-novitiates",    label: "Novitiates",                system: "kill-team", alliance: "Imperium", color: "#8A1C2B", emblem: "wings" },
  { id: "kt-phobos",        label: "Phobos Strike Team",        system: "kill-team", alliance: "Imperium", color: "#1B4B6B", emblem: "crescent" },
  { id: "kt-ratlings",      label: "Ratlings",                  system: "kill-team", alliance: "Imperium", color: "#7A6A3E", emblem: "fangs" },
  { id: "kt-sanctifiers",   label: "Sanctifiers",               system: "kill-team", alliance: "Imperium", color: "#8A1C2B", emblem: "sunburst" },
  { id: "kt-scout-squad",   label: "Scout Squad",               system: "kill-team", alliance: "Imperium", color: "#1B4B6B", emblem: "chevrons" },
  { id: "kt-spectre-squad", label: "Spectre Squad",             system: "kill-team", alliance: "Imperium", color: "#5C5568", emblem: "knot" },
  { id: "kt-strike-force-variel",label:"Strike Force Variel",  system: "kill-team", alliance: "Imperium", color: "#B08A2E", emblem: "tower" },
  { id: "kt-tempestus",     label: "Tempestus Aquilons",         system: "kill-team", alliance: "Imperium", color: "#5A6340", emblem: "bolt" },
  { id: "kt-wolf-scouts",   label: "Wolf Scouts",               system: "kill-team", alliance: "Imperium", color: "#6C8794", emblem: "fangs" },
  { id: "kt-blooded",       label: "Blooded",                    system: "kill-team", alliance: "Chaos", color: "#96222B", emblem: "claw" },
  { id: "kt-chaos-cult",    label: "Chaos Cult",                 system: "kill-team", alliance: "Chaos", color: "#6B2450", emblem: "eye" },
  { id: "kt-fellgor",       label: "Fellgor Ravagers",           system: "kill-team", alliance: "Chaos", color: "#7A5C3C", emblem: "helm" },
  { id: "kt-gellerpox",     label: "Gellerpox Infected",         system: "kill-team", alliance: "Chaos", color: "#6E7443", emblem: "trefoil" },
  { id: "kt-goremongers",   label: "Goremongers",                system: "kill-team", alliance: "Chaos", color: "#96222B", emblem: "hammer" },
  { id: "kt-legionary",     label: "Legionary",                  system: "kill-team", alliance: "Chaos", color: "#5B2E63", emblem: "sunburst" },
  { id: "kt-murderwing",    label: "Murderwing",                 system: "kill-team", alliance: "Chaos", color: "#3C3C42", emblem: "wings" },
  { id: "kt-nemesis-claw",  label: "Nemesis Claw",               system: "kill-team", alliance: "Chaos", color: "#5A3242", emblem: "claw" },
  { id: "kt-plague-marines",label: "Plague Marines",            system: "kill-team", alliance: "Chaos", color: "#6E7443", emblem: "flame" },
  { id: "kt-warpcoven",     label: "Warpcoven",                  system: "kill-team", alliance: "Chaos", color: "#1E6E6B", emblem: "spiral" },
  { id: "kt-blades-of-khaine",label:"Blades of Khaine",         system: "kill-team", alliance: "Aeldari", color: "#8E2340", emblem: "crescent" },
  { id: "kt-corsair",       label: "Corsair Voidscarred",        system: "kill-team", alliance: "Aeldari", color: "#2E7C86", emblem: "wings" },
  { id: "kt-dragon-masters",label: "Dragon Masters",             system: "kill-team", alliance: "Aeldari", color: "#2F6F4E", emblem: "serpent" },
  { id: "kt-hand-of-archon",label: "Hand of the Archon",        system: "kill-team", alliance: "Aeldari", color: "#3F5A72", emblem: "eye" },
  { id: "kt-mandrakes",     label: "Mandrakes",                  system: "kill-team", alliance: "Aeldari", color: "#3F5A72", emblem: "knot" },
  { id: "kt-void-dancer",   label: "Void-Dancer Troupe",         system: "kill-team", alliance: "Aeldari", color: "#8E3A7E", emblem: "spiral" },
  { id: "kt-brood-brothers",label: "Brood Brothers",            system: "kill-team", alliance: "Xenos", color: "#7A5C8E", emblem: "spiral" },
  { id: "kt-canoptek",      label: "Canoptek Circle",            system: "kill-team", alliance: "Xenos", color: "#4C7A3E", emblem: "cog" },
  { id: "kt-farstalker",    label: "Farstalker Kinband",         system: "kill-team", alliance: "Xenos", color: "#B4642A", emblem: "shield" },
  { id: "kt-hearthkyn",     label: "Hearthkyn Salvagers",        system: "kill-team", alliance: "Xenos", color: "#B08A2E", emblem: "anvil" },
  { id: "kt-hernkyn",       label: "Hernkyn Yaegirs",            system: "kill-team", alliance: "Xenos", color: "#8A6A3E", emblem: "bolt" },
  { id: "kt-hierotek",      label: "Hierotek Circle",            system: "kill-team", alliance: "Xenos", color: "#4C7A3E", emblem: "bones" },
  { id: "kt-kommandos",     label: "Kommandos",                  system: "kill-team", alliance: "Xenos", color: "#5C7A29", emblem: "fangs" },
  { id: "kt-pathfinder",    label: "Pathfinder Incursion",       system: "kill-team", alliance: "Xenos", color: "#B4642A", emblem: "chevrons" },
  { id: "kt-raveners",      label: "Raveners",                   system: "kill-team", alliance: "Xenos", color: "#B8542E", emblem: "claw" },
  { id: "kt-vespid",        label: "Vespid Stingwings",          system: "kill-team", alliance: "Xenos", color: "#B4642A", emblem: "wings" },
  { id: "kt-wrecka-krew",   label: "Wrecka Krew",                system: "kill-team", alliance: "Xenos", color: "#5C7A29", emblem: "hammer" },
  { id: "kt-wyrmblade",     label: "Wyrmblade",                  system: "kill-team", alliance: "Xenos", color: "#7A5C8E", emblem: "serpent" },
  { id: "kt-stealth-suits", label: "XV26 Stealth Battlesuits",  system: "kill-team", alliance: "Xenos", color: "#B4642A", emblem: "eye" },

  // Everything else
  { id: "generic",              label: "Unaligned & Terrain",  system: "other", alliance: "General",   color: "#6B6560", emblem: "knot" },
];

const SYSTEMS = [
  { id: "40k", label: "Warhammer 40,000", alliances: ["Imperium", "Chaos", "Xenos"] },
  { id: "aos", label: "Age of Sigmar", alliances: ["Order", "Chaos", "Death", "Destruction"] },
  { id: "necromunda", label: "Necromunda", alliances: ["House Gangs", "Law Enforcement", "Cults & Heretics", "Outlanders & Specialists"] },
  { id: "old-world", label: "Warhammer: The Old World", alliances: ["Kingdoms of Men", "Elves", "Dwarfs & Greenskins", "Chaos & Undead"] },
  { id: "horus-heresy", label: "Horus Heresy", alliances: ["Loyalist Legions", "Traitor Legions", "Imperial Auxilia", "Mechanicum & Custodes"] },
  { id: "blood-bowl", label: "Blood Bowl", alliances: ["Old World & Civilised", "Greenskin & Monstrous", "Chaos & Evil", "Undead", "Underworld & Reptile"] },
  { id: "kill-team", label: "Kill Team", alliances: ["Imperium", "Chaos", "Aeldari", "Xenos"] },
  { id: "other", label: "Everything Else", alliances: ["General"] },
];

// --- D&D miniatures: no faction/alliance concept the way a wargame army
// does, so this is a small fixed list of what a mini actually IS, expressed
// in the identical { id, label, system, alliance, color, emblem } shape a
// faction uses -- that's what lets every existing faction-shaped renderer
// (tiles, cards, generateId) work against this with zero changes. Ids are
// namespaced (dnd-*) so they can never collide with a Games Workshop id in
// the shared HOBBIES lookup below.
const DND_CATEGORIES = [
  { id: "dnd-player-character", label: "Player Character",  system: "dnd", alliance: "All", color: "#7A5C8E", emblem: "crown" },
  { id: "dnd-monster",          label: "Monster",            system: "dnd", alliance: "All", color: "#8E1B24", emblem: "claw"  },
  { id: "dnd-npc",               label: "NPC",                system: "dnd", alliance: "All", color: "#3F6D8E", emblem: "helm"  },
  { id: "dnd-terrain",          label: "Terrain & Scenery",  system: "dnd", alliance: "All", color: "#4C7A3E", emblem: "leaf"  },
  { id: "dnd-vehicle",          label: "Vehicle",            system: "dnd", alliance: "All", color: "#7E5A3C", emblem: "cog"   },
];
const DND_SYSTEMS = [
  { id: "dnd", label: "D&D Miniatures", alliances: ["All"] },
];

// --- Hobbies: the top-level thing a recipe belongs to. Warhammer wraps the
// existing FACTIONS/SYSTEMS by reference (not a copy) so nothing about that
// data changes shape; a hobby with no real faction/alliance hierarchy (D&D)
// sets flatBrowse so the browse page skips the two-level System/Alliance
// grouping and just shows one flat grid of its "factions" (categories).
// Warhammer is always enabled for every account -- see enabledHobbyIds() in
// app.js -- so it deliberately has no on/off state of its own here.
const HOBBIES = [
  {
    id: "warhammer", label: "Warhammer",
    flatBrowse: false, browseTitle: "Armies", groupLabel: "Army", groupLabelPlural: "Armies", wholeGroupLabel: "whole army",
    factions: FACTIONS, systems: SYSTEMS,
    namePlaceholder: "e.g. Ork Boyz Skin",
    unitPlaceholder: "e.g. Boyz, Termagants, Intercessors",
  },
  {
    id: "dnd", label: "D&D Miniatures",
    flatBrowse: true, browseTitle: "Categories", groupLabel: "Category", groupLabelPlural: "Categories", wholeGroupLabel: "whole category",
    factions: DND_CATEGORIES, systems: DND_SYSTEMS,
    namePlaceholder: "e.g. Frost Giant Skin",
    unitPlaceholder: "e.g. Goblin, Owlbear, Paladin",
  },
];

function hobby(id) {
  return HOBBIES.find((h) => h.id === id) || HOBBIES[0];
}
function faction(id) {
  for (const h of HOBBIES) {
    const f = h.factions.find((x) => x.id === id);
    if (f) return f;
  }
  return FACTIONS[FACTIONS.length - 1];
}

function emblemPaths(key) {
  return EMBLEMS[key] || EMBLEMS.knot;
}

export { EMBLEMS, FACTIONS, SYSTEMS, DND_CATEGORIES, DND_SYSTEMS, HOBBIES, hobby, faction, emblemPaths };
