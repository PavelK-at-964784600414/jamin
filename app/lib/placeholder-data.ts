import { Member, Theme } from './definitions';

// Note: This file is only used for development and seeding the database with test data.
// It should not be imported in production code.

const themes: Theme[] = [
  {
    id: '1',
    member_id: 'd6e15727-9fe1-4961-8c5b-ea44a9bd81aa', // Reference to a member
    title: 'Gangstas Paradise',
    description: 'rock',
    seconds: 24,
    keySignature: 'C',
    mode: 'minor',
    chords: "'min', 'maj', '7', 'm7'",
    tempo: 80,
    recording_url: '/samples/Gangstas Paradise.mp3',
    instrument: 'guitar',
    date: '2024-10-06',
    status: 'complete',
  },
  {
    id: '2',
    member_id: '3958dc9e-712f-4377-85e9-fec4b6a6442a', // Reference to a member
    title: 'ECAB',
    description: 'rock',
    seconds: 0,
    keySignature: 'E',
    mode: 'minor',
    chords: "'min', 'maj', '7', 'm7'",
    tempo: 120,
    recording_url: '/samples/Shalom.mp3',
    instrument: 'piano',
    date: '2024-10-07',
    status: 'in progress',
  },
];

const members: Member[] = [
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442a',
    user_name: 'User',
    email: 'user@nextmail.com',
    password: '123456',
    image_url: '/members/user.png',
    details: {
      first_name: 'User',
      last_name: 'Name',
      country: 'Country',
      instrument: 'Instrument',
    },
    themes: null,
  },
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442a',
    user_name: 'Pash',
    email: 'pash@jamin.com',
    password: 'GfgRSG%$g435a3224',
    image_url: '/members/pash.png',
    details: {
      first_name: 'Pash',
      last_name: 'Lastname',
      country: 'Country',
      instrument: 'Instrument',
    },
    themes: null,
  },
  {
    id: 'd6e15727-9fe1-4961-8c5b-ea44a9bd81aa',
    user_name: 'Evil Rabbit',
    email: 'evil@rabbit.com',
    password: 'password', // Placeholder password
    image_url: '/members/evil-rabbit.png',
    details: {
      first_name: 'Evil',
      last_name: 'Rabbit',
      country: 'Wonderland',
      instrument: 'Guitar',
    },
    themes: null,
  },
  {
    id: '3958dc9e-712f-4377-85e9-fec4b6a6442a',
    user_name: 'Delba de Oliveira',
    email: 'delba@oliveira.com',
    password: 'password', // Placeholder password
    image_url: '/members/delba-de-oliveira.png',
    details: {
      first_name: 'Delba',
      last_name: 'de Oliveira',
      country: 'Brazil',
      instrument: 'Piano',
    },
    themes: null,
  },
  {
    id: '3958dc9e-742f-4377-85e9-fec4b6a6442a',
    user_name: 'Lee Robinson',
    email: 'lee@robinson.com',
    password: 'password', // Placeholder password
    image_url: '/public/members/lee-robinson.png',
    details: {
      first_name: 'Lee',
      last_name: 'Robinson',
      country: 'USA',
      instrument: 'Drums',
    },
    themes: null,
  },
  {
    id: '76d65c26-f784-44a2-ac19-586678f7c2f2',
    user_name: 'Michael Novotny',
    email: 'michael@novotny.com',
    password: 'password', // Placeholder password
    image_url: '/members/michael-novotny.png',
    details: {
      first_name: 'Michael',
      last_name: 'Novotny',
      country: 'Germany',
      instrument: 'Bass',
    },
    themes: null,
  },
  {
    id: 'CC27C14A-0ACF-4F4A-A6C9-D45682C144B9',
    user_name: 'Amy Burns',
    email: 'amy@burns.com',
    password: 'password', // Placeholder password
    image_url: '/members/amy-burns.png',
    details: {
      first_name: 'Amy',
      last_name: 'Burns',
      country: 'UK',
      instrument: 'Violin',
    },
    themes: null,
  },
  {
    id: '13D07535-C59E-4157-A011-F8D2EF4E0CBB',
    user_name: 'Balazs Orban',
    email: 'balazs@orban.com',
    password: 'password', // Placeholder password
    image_url: '/members/balazs-orban.png',
    details: {
      first_name: 'Balazs',
      last_name: 'Orban',
      country: 'Hungary',
      instrument: 'Flute',
    },
    themes: null,
  },
];

export { members, themes };