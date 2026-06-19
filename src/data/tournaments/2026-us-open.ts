import type { Tournament } from "../types";

export const usOpen2026: Tournament = {
  slug: "us-open",
  year: 2026,
  name: "U.S. Open",
  shortName: "U.S. Open",
  venue: "Shinnecock Hills Golf Club",
  location: "Southampton, NY",
  startDate: "2026-06-18",
  endDate: "2026-06-21",
  timeZone: "America/New_York",
  espn: {
    season: 2026,
    tournamentId: "401811952",
  },
  // Special format for this event only: each team picks 4 players and all 4
  // count. Any missed cut / WD leaves fewer than 4 valid scores, so the team
  // is marked CUT.
  countedPlayers: 4,
  scoringLabel: "4 Players · All Count",
  teams: [
    {
      owner: "Mike Kohler",
      players: ["Wyndham Clark", "Matt Fitzpatrick", "Kristoffer Reitan", "Bryson DeChambeau"],
    },
    {
      owner: "Nicholas Kohler",
      players: ["Wyndham Clark", "Matt Fitzpatrick", "Jon Rahm", "Rory McIlroy"],
    },
    {
      owner: "Jack Keller",
      players: ["Wyndham Clark", "Jon Rahm", "Rory McIlroy", "Bryson DeChambeau"],
    },
    {
      owner: "Judy Keller",
      players: ["Matt Fitzpatrick", "Rory McIlroy", "Ludvig Åberg", "Brian Harman"],
    },
    {
      owner: "Jack Canmann",
      players: ["Jon Rahm", "Rory McIlroy", "Ludvig Åberg", "Tommy Fleetwood"],
    },
    {
      owner: "Charlie Keller",
      players: ["Matt Fitzpatrick", "Rory McIlroy", "Tommy Fleetwood", "Sam Burns"],
    },
    {
      owner: "Gabby Paracchini",
      players: ["Wyndham Clark", "Matt Fitzpatrick", "Jon Rahm", "Rory McIlroy"],
    },
    {
      owner: "Liz Kohler",
      players: ["Rory McIlroy", "Rickie Fowler", "Scottie Scheffler", "Ludvig Åberg"],
    },
    {
      owner: "Peter Kohler",
      players: ["Ryder Cowan (A)", "Dustin Johnson", "Wyndham Clark", "Ben James"],
    },
  ],
};
