import React from 'react';

const GenNavbar = ({ generations, setCurrentGen, currentGen }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
            { generations.map((gen, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                    <div onClick={() => setCurrentGen(gen)} className={`font-theme gen-nav-item ${currentGen === gen ? 'gen-nav-item-selected' : ''}`}>
                        { gen }
                    </div>
                    { index < 6 && <span className='font-theme' style={{ fontSize: 'large', margin: '0 10px', color: 'slategray' }}>-</span>}
                </div>
            ))}
            
        </div>
    )
}

export default GenNavbar;