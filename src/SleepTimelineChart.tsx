import { useState, useRef, useEffect } from 'react'
import * as d3 from 'd3';

interface TimelineEntry {
    from: Date;
    to: Date;
}

interface SleepTimelineChartProps {
    sleepTimelineEntries: TimelineEntry[];
}

function SleepTimelineChart({ sleepTimelineEntries }: SleepTimelineChartProps) {

    console.log("props.sleepTimelineEntries: %o", sleepTimelineEntries);

    const d3Container = useRef(null);

    const width = 960;
    const height = 500;

    let rectangles = [];

    function getStartOfDayDate(date) {
        const d = new Date(date);
        d.setHours(0,0,0,0);
        return d;
    }

    function getEndOfDayDate(date) {
        const d = new Date(date);
        d.setHours(23,59,59,999);
        return d;
    }

    /*
    sleepTimelineEntries.forEach((d) => {
        const fromDate = new Date(d.from);
        const toDate = new Date(d.to);

        const fromDay = fromDate.getDay();
        const toDay = toDate.getDay();

        const MILLIS_IN_A_DAY = 1000 * 60 * 60 * 24;

        for (let i = getStartOfDayDate(fromDate).valueOf(); i <= getEndOfDayDate(toDate).valueOf(); i += MILLIS_IN_A_DAY) {

            const iDate = new Date(i);

            const rectangleStart = (fromDay === iDate.getDay())
                                 ? new Date(fromDate)
                                 : getStartOfDayDate(iDate);

            const rectangleEnd = (toDay === iDate.getDay())
                               ? new Date(toDate)
                               : getEndOfDayDate(iDate);

            rectangles.push({
                from: rectangleStart,
                to: rectangleEnd
            });            
        }
    });
    */
    rectangles = sleepTimelineEntries.map((d) => {
        return {
            from: new Date(d.from),
            to: new Date(d.to)
        };
    });
    console.log("rectangles: %o", rectangles);
    
    useEffect(() => {
        
        const marginTop = 20;
        const marginRight = 20;
        const marginBottom = 30;
        const marginLeft = 40;
        
        // get + modify the SVG container.
        const svg = d3.select(d3Container.current)
                      .attr("width", width)
                      .attr("height", height)
                      .attr("viewBox", [0, 0, width, height])
                      .attr("style", "max-width: 100%; height: auto;")
                      .call(zoom);
        
        // Declare the x (horizontal position) scale.
        // https://stackoverflow.com/questions/48267195/d3-axis-with-dates
        const x = d3.scaleTime()
                    .domain(d3.extent(rectangles, (d) => d.from))
                    .range([marginLeft, width - marginRight]);

        const xAxis = d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0);

        function myInterpolate(a, b) {
            const shift = height / 2;
            const max_value = Math.max(a, b)
            const min_value = Math.min(a, b)
            
            return function(t) {

                let result = a * (1 - t) + b * t + shift;
                if (result < min_value) {
                    result = result + max_value
                } else if (result > max_value) {
                    result = result % max_value
                }

                return result
            }
        }
        
        const y = d3.scaleLinear()
                    .domain([0, 23])
                    .range([height - marginBottom, marginTop])
                    .interpolate(myInterpolate);

        svg.append("g")
           .attr("fill", "steelblue")
           .selectAll()
           .data(rectangles)
           .join("rect")
           .attr("x", (d) => {
               const dayStart = new Date(d.from);
               dayStart.setHours(0,0,0,0);
               const dayEnd = new Date(d.from);
               dayEnd.setHours(23,59,59,999);
               
               return x(dayStart) + ((x(dayEnd) - x(dayStart)) * .1); // Date
           })
           .attr("width", (d) => {
               const dayStart = new Date(d.from);
               const dayEnd = new Date(d.from);
               
               dayStart.setHours(0,0,0,0);
               dayEnd.setHours(23,59,59,999);

               return x(dayEnd) - x(dayStart) - ((x(dayEnd) - x(dayStart)) * .1); // Date + 1
           })
           .attr("y", (d) => {

               const endHours = d.to.getHours() + (d.to.getMinutes() / 60);
               return y(endHours);
           }) 
           .attr("height", (d) => {
               const startHours = d.from.getHours() + (d.from.getMinutes() / 60);
               const endHours = d.to.getHours() + (d.to.getMinutes() / 60);
               return (y(startHours) - y(endHours));
           });
        
        // Add the x-axis and label.
        svg.append("g")
           .attr("transform", `translate(0,${height - marginBottom})`)
           .attr("class", "x-axis")
           //.call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
           .call(xAxis, x)
           .call((g) => g.append("text")
                         .attr("x", width)
                         .attr("y", marginBottom - 4)
                         .attr("fill", "currentColor")
                         .attr("text-anchor", "end")
                         .text("Night →"));

        const yAxis = d3.axisLeft(y).tickValues(d3.range(24)).tickFormat(d => ~~d);//d3.axisLeft(y).ticks(height / 20);

            
        // Add the y-axis and label
        svg.append("g")
           .attr("transform", `translate(${marginLeft},0)`)
        //           .call(d3.axisLeft(y).ticks(height / 20))
           .call(yAxis)
        //           .call((g) => g.select(".domain").remove())
           .call((g) => g.append("text")
                         .attr("x", -marginLeft)
                         .attr("y", 10)
                         .attr("fill", "currentColor")
                         .attr("text-anchor", "start")
                         .text("↑ Sleep Time"));
        

        console.log(svg);
        
        function zoom(svg) {
            const extent = [[marginLeft, marginTop], [width - marginRight, height - marginTop]];

            svg.call(d3.zoom()
                       .scaleExtent([1, 50])
                       .translateExtent(extent)
                       .extent(extent)
                       .on("zoom", zoomed));

            function zoomed(event) {
                
                x.range([marginLeft, width - marginRight].map(d => event.transform.applyX(d)));

                const dayLength = x(getEndOfDayDate(new Date())) - x(getStartOfDayDate(new Date()));
                
                svg.selectAll("g rect")
                   .attr("x", (d) => {
                       const dayStart = getStartOfDayDate(new Date(d.from));
                       const dayEnd = getEndOfDayDate(new Date(d.from));
                       
                       return x(dayStart) + (dayLength * .1); // Date
                   })
                   .attr("width", (d) => {
                       return dayLength - (dayLength * .1); // Date + 1
                   })

                svg.selectAll(".x-axis").call(xAxis);
            }
        }
    });
    
    return (
        <>
            <svg id="my-svg"
                 width={width}
                 height={height}
                 ref={d3Container} />
        </>
    )
}

export default SleepTimelineChart;
