import axios from 'axios';
import faker from 'faker';
import { v4 as uuidv4 } from 'uuid';
import { getAPIRequestHeader } from '../utils';
import appConfig from '../config';

export const getGenerations = (id) => new Promise((resolve, reject) => (
    setTimeout(() => {
        const result = { generations: [1, 2, 3, 4, 5, 6, 7, 8] }
        //const rand = getRandomInt(10);
        //if (rand < 2) reject({ message: 'Unable to fetch generations' })
        resolve(result);
    }, 1000)
))

export const getPokedexData = async ({ pageParam = 0 }) => {
    console.log('Page param is', pageParam);
    const resp = await axios.get('https://pokeapi.co/api/v2/pokemon', { params: { offset: pageParam*20, limit: 20 }})
    let results = [];

    for (let dexEntry of resp.data['results']) {
        const dexEntryData = await getPokedexEntryData(dexEntry.name);
        results.push(dexEntryData)
    }

    /*resp.data['results'].forEach(dexEntry => {
        getPokedexEntryData(dexEntry.name)
            .then(data => results.push(data));
    })*/
    return { ...resp.data, results };
}

export const getPokedexEntryData = async (dexEntry) => {
    const resp = await axios.get(`https://pokeapi.co/api/v2/pokemon/${dexEntry}`);
    return resp.data;
}

export const getPokedexSpeciesEntryData = async (dexEntry) => {
    const resp = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${dexEntry}`);
    return resp.data;
}