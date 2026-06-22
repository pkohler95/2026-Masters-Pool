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
    {
      owner: "John Keller",
      players: ["Jon Rahm", "Wyndham Clark", "Rory McIlroy", "Scottie Scheffler"],
    },
    {
      owner: "Reid Keller",
      players: ["Rory McIlroy", "Ludvig Åberg", "Tommy Fleetwood", "Scottie Scheffler"],
    },
  ],
  results: {
    status: "Final",
    finalizedAt: "2026-06-21T19:30:00-04:00",
    winner: "Wyndham Clark",
    winnerScore: "-4",
    players: [
      { name: "Wyndham Clark", position: "1", score: "-4", status: "made-cut" },
      { name: "Sam Burns", position: "2", score: "-3", status: "made-cut" },
      { name: "Scottie Scheffler", position: "T4", score: "E", status: "made-cut" },
      { name: "Tommy Fleetwood", position: "T11", score: "+2", status: "made-cut" },
      { name: "Ludvig Åberg", position: "T17", score: "+3", status: "made-cut" },
      { name: "Matt Fitzpatrick", position: "22", score: "+4", status: "made-cut" },
      { name: "Ben James", position: "T23", score: "+5", status: "made-cut" },
      { name: "Ryder Cowan", position: "T23", score: "+5", status: "made-cut" },
      { name: "Brian Harman", position: "T32", score: "+6", status: "made-cut" },
      { name: "Dustin Johnson", position: "T32", score: "+6", status: "made-cut" },
      { name: "Rory McIlroy", position: "T32", score: "+6", status: "made-cut" },
      { name: "Bryson DeChambeau", position: "—", score: "CUT", status: "cut" },
      { name: "Rickie Fowler", position: "—", score: "CUT", status: "cut" },
      { name: "Jon Rahm", position: "—", score: "CUT", status: "cut" },
      { name: "Kristoffer Reitan", position: "—", score: "CUT", status: "cut" },
    ],
  },
};
