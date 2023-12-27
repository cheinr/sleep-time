import { useState, useRef, useEffect } from 'react'
import './App.css'

import SleepTimelineChart from './SleepTimelineChart';
import FileDropZone from './FileDropZone';

import React from 'react'
import { useDrag } from 'react-dnd'

function App() {
    let [data, setData] = useState([]);
    function onFileUpload(files) {
        console.log("files: %o", files);
        const fileReader = new FileReader();

        fileReader.onload = (evt) => {
            console.log(evt.target.result);

            const result = evt.target.result;
            const lines = result.split("\n");
            console.log(lines);

            const newData = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(",");

                const secondsToSleep = parseInt(values[7]);
                const secondsToWakeUp = parseInt(values[8]);

                console.log("SecondsToSleep: %o, secondsToWakeUp: %o", secondsToSleep, secondsToWakeUp);

                const sleepStart = new Date(new Date(values[0]).valueOf() + (secondsToSleep * 1000));
                const sleepEnd = new Date(new Date(values[1]).valueOf() - (secondsToWakeUp * 1000));

                newData.push({ from: sleepStart, to: sleepEnd });
            }
            console.log("data: %o", data);

            setData(newData);
        };
        
        fileReader.readAsText(files[0]);
    }

    
    return (
        <>
            <FileDropZone onFileUpload={onFileUpload} />
            { (data.length > 0) && <SleepTimelineChart sleepTimelineEntries={data} /> }
        </>
    )
}

export default App
