import { Chip } from '@material-ui/core';
import React, { useState } from 'react';
import SpeciesInfoRow from './SpeciesInfoRow';
import SpeciesItemDetail from './SpeciesItemDetail';

const SpeciesInfo = ({ speciesData, dexEntryData }) => {

    const [scaleMale, setScaleMale] = useState(1);
    const [scaleFemale, setScaleFemale] = useState(1);

    const getPokemonSpeciesGenus = () => {
        if (!speciesData) return null;
        const genus = speciesData.genera.find(obj => obj.language.name === 'en');
        console.log('genus', genus);
        return genus.genus;
    }

    const getMaleGenderRate = () => {
        const rate = ((8 - speciesData.gender_rate)/8) * 100;
        return rate;
    }

    const getFemaleGenderRate = () => {
        return 100 - getMaleGenderRate();
    }

    const onGenderMouseEnter = (gender) => {
        if (gender === 'male') {
            setScaleMale(1.4);
            setScaleFemale(1);
        } else {
            setScaleFemale(1.4);
            setScaleMale(1);
        }
    }

    const onGenderMouseLeave = (gender) => {
        if (gender === 'male') {
            setScaleMale(1);
        } else setScaleFemale(1);
    }

    return (
        <div style={{ display: 'flex', width: '500px', flexDirection: 'column', alignItems: 'center', margin: '5px 10px', backgroundColor: 'slategray', borderRadius: '10px', border: '5px solid grey' }}>
            <img style={{ maxHeight: '200px', maxWidth: '200px' }} src="https://cdn2.bulbagarden.net/upload/2/21/001Bulbasaur.png" alt={speciesData.name} />
            <div className='theme-text-whitebkg' style={{ width: '100%', textAlign: 'center', padding: '5px', backgroundColor: 'white', margin: '10px 0', borderRadius: '5px' }}>
                { getPokemonSpeciesGenus() }
            </div>
            <SpeciesInfoRow>
                <SpeciesItemDetail title='Base Happiness'>
                    { speciesData.base_happiness}
                </SpeciesItemDetail>
                <SpeciesItemDetail title='Capture Rate'>
                    { speciesData.capture_rate}%
                </SpeciesItemDetail>
            </SpeciesInfoRow>
            <div style={{ backgroundColor: 'lightgrey', borderRadius: '5px', padding: '0 10px 10px 10px', margin: '10px', width: '100%' }}>
                <span className='theme-text-whitebkg'>Gender Ratio</span>
                <div style={{ display: 'flex', width: '100%', backgroundColor: 'white', padding: '10px', borderRadius: '5px' }}>
                    <div 
                        onMouseLeave={() => onGenderMouseLeave('male')} 
                        onMouseEnter={() => onGenderMouseEnter('male')} 
                        style={{ textAlign: 'center', transition: 'all .3s ease-in-out', transform: `scaleY(${scaleMale})`, width: `${getMaleGenderRate()}%`, height: '20px', backgroundColor: 'slateblue', borderRadius: '5px 0 0 5px' }}
                    >
                        <span style={{ textAlign: 'center', transition: 'all .3s ease-in-out', fontSize: '10px' }} className='theme-text'>
                            { scaleMale > 1 ? `${getMaleGenderRate()}%` : '' }
                        </span>
                    </div>
                    <div 
                        onMouseLeave={() => onGenderMouseLeave('female')} 
                        onMouseEnter={() => onGenderMouseEnter('female')} 
                        style={{ textAlign: 'center', transition: 'all .3s ease-in-out', transform: `scaleY(${scaleFemale})`, width: `${getFemaleGenderRate()}%`, height: '20px', backgroundColor: 'darkred', borderRadius: '0 5px 5px 0' }}
                    >
                        <span style={{ textAlign: 'center', transition: 'all .3s ease-in-out', fontSize: '10px' }} className='theme-text'>
                            { scaleFemale > 1 ? `${getFemaleGenderRate()}%` : '' }
                        </span>
                    </div>
                </div>
            </div>
            <SpeciesInfoRow>
                <SpeciesItemDetail title='Height'>
                    <div style={{ display: 'flex', justifyContent: 'space-between'}}>
                        <div style={{ margin: '0 5px 0 0'}}>{ ((dexEntryData.height * 0.1)/0.3048).toFixed(0) }'{ ((((dexEntryData.height * 0.1)/0.3048)*12)%12).toFixed(0) }</div>
                        <div style={{ margin: '0 0 0 5px'}}>{(dexEntryData.height * 0.1).toFixed(2)} m</div>
                    </div>
                </SpeciesItemDetail>
                <SpeciesItemDetail title='Weight'>
                    <div style={{ display: 'flex', justifyContent: 'space-between'}}>
                        <div style={{ margin: '0 5px 0 0'}}>{ (dexEntryData.weight * 0.1 * 2.20462262185).toFixed(1) } lbs</div>
                        <div style={{ margin: '0 0 0 5px'}}>{dexEntryData.weight * 0.1} kg</div>
                    </div>
                </SpeciesItemDetail>
            </SpeciesInfoRow>
            <SpeciesInfoRow>
                <SpeciesItemDetail title='Egg Groups'>
                    { speciesData.egg_groups.map((group, index) => (
                        <Chip 
                            classes={{ label: 'theme-text-whitebkg' }} 
                            style={{ marginRight: '3px', marginBottom: '3px' }} 
                            key={index} 
                            label={group.name} variant='outlined' color='secondary'/>
                    ))}
                </SpeciesItemDetail>
            </SpeciesInfoRow>
            <SpeciesInfoRow>
                <SpeciesItemDetail title='Hatch Time'>
                    { (speciesData.hatch_counter + 1) * 255 } steps
                </SpeciesItemDetail>
                <SpeciesItemDetail title='Leveling Rate'>
                    { speciesData.growth_rate.name }
                </SpeciesItemDetail>
            </SpeciesInfoRow>
            <SpeciesInfoRow>
                <SpeciesItemDetail title='Shape'>
                    <img style={{ maxHeight: '30px', maxWidth: '30px' }} src="https://cdn2.bulbagarden.net/upload/d/d3/Body03.png" alt="Body Shape" />
                </SpeciesItemDetail>
            </SpeciesInfoRow>
        </div>
    )
}

export default SpeciesInfo;