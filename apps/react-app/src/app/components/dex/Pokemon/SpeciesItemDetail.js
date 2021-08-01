import React from 'react';

const SpeciesItemDetail = ({ children, title }) => {
    return (
        <div style={{ backgroundColor: 'lightgrey', borderRadius: '5px', padding: '0 10px 10px 10px', margin: '10px' }}>
            <span className='theme-text-whitebkg' style={{ textAlign: 'center', display: 'block' }}>{ title }</span>
            <div style={{ backgroundColor: 'white', borderRadius: '5px', padding: '5px', textAlign: 'center' }}>
                { children }
            </div>
        </div>
    )
}

export default SpeciesItemDetail;