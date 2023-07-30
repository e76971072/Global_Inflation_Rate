//
// CS 416 - Data Visualization - By Kevin Nguyen
//
//
//

async function loadData ( ) {
	var countriesTable = {};
	let updateTimer; // Debouncing timer
	var inflationData =  {};
	var cols = '';
	var thead = ' '
	var table  = d3.select("table");
	var tbody;
	var headers;
	var svgPath;



	var buttonExplore = d3.select("#Explore");
	buttonExplore.on("click", function (d) {
			d3.select(".sliderRange").style("visibility", 'visible');
			d3.select(".tableContainer").style("visibility", 'visible');

	})


	var buttonExplore = d3.select("#Overview");
	buttonExplore.on("click", function (d) {
			d3.select(".tableContainer").style("visibility", 'hidden');
			d3.select(".sliderRange").style("visibility", 'hidden');


	})
	d3.select(".sliderRange").style("visibility", 'hidden');



	d3.csv('./Inflation_Consumer_Prices/data.csv').then( function(data) {
		d3.csv ("./P_Data_Extract_From_World_Development_Indicators/GDP.csv").then( function (GDPdata) {
			// populating default table
			var cleanData = [];
			var columns =  data['columns'];
			cols = columns;
			var svg = d3.select("svg")
			// Append the table header
			thead = table.append("thead").attr("id", 'thead');
			headers = data['columns'];
			thead.append("tr")
			.selectAll("th")
			.data(headers)
			.enter()
			.append("th")
			.attr("font-family", 'Times new Roman')
			.attr("font-size", "3px")
			.text(function(d) { return d; });
			 // Append the table rows
		tbody = table.append("tbody").attr("width", "10%").attr('id', 'tbody');

		//  Append the table cells
		data.forEach( function(row) {
			var tableRow  = tbody.append("tr");
			countriesTable[row['Country Name']] = row['Country Code'];
			inflationData [ row['Country Name']]  = row;
			columns.forEach( function (column){
			 	tableRow.append("td")
			 	.text(row[column]);
			 });
			});

		})
	})

	const width = 800;
	const height = 1100;

	// Create a projection for the map
	const projection = d3.geoMercator()
	  .scale(150)
	  .translate([width / 2, height / 2]);

	// Create a path generator
	const path = d3.geoPath().projection(projection);

	// Create the SVG container
	const svg = d3.select("#svgMap")
	  .attr("width", width)
	  .attr("height", height);

	// Load the TopoJSON data
	var mappedData = null;
	var countries;
	var map;
	var GDPdata = {};
	d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((data) => {
		d3.csv ("./P_Data_Extract_From_World_Development_Indicators/GDP.csv").then( function (data2) {
			for ( i =0; i< data2.length; i ++ ) {
				GDPdata[data2[i]['Country Code']] = data2[i];
			}

	       // Convert TopoJSON to GeoJSON
		   countries = topojson.feature(data, data.objects.countries).features;
		   map = svg.append("g");

				 reColor("2022");
			 // Create a group for the map features


			svgPath = map.selectAll("path")
				 .data(countries)
				 .enter().append("path")
				 .attr("d", path)
				 .attr("stroke", "#fff")

				 .attr("fill",  function (d) {
					 var inflationValue = 0;
					 for  ( i =0; i  < mappedData.length; i ++ ) {
							 if ( mappedData[i].countryName.includes(d.properties.name) ) {
								 inflationValue = mappedData[i].inflationValue;
							 }
					 }
					 if (inflationValue !== null) {
					 if (inflationValue < 3) {
						 return '#3c3'; // Light green for inflation < 3
					 } else if (inflationValue >= 3 && inflationValue <= 8) {
						 return '#fc0'; // Yellow for inflation between 3 and 8
					 } else if (inflationValue > 8 && inflationValue <= 16) {
						 return '#fa5'; // Orange for inflation between 8 and 16
					 } else {
						 return '#f00'; // Red for inflation > 16
					 }
					 }
				 })
				 .attr("id",  function(d) { return d.properties.name });

		});
				});



				function reColor ( year ) {
					console.log(year);
					svg.selectAll("path").remove();
					mappedData = countries.map(country => {
					const countryName = country.properties.name;
					const inflationKey = Object.keys(inflationData).find(key => key.includes(countryName));
					const inflationValue = inflationKey ? parseFloat(inflationData[inflationKey][year]) : null;
					return { countryName, inflationValue };
				});

				map = svg.append("g");
				// Create a group for the map features
				var tooltip = d3.select("#countryDisplay");
				// Add the map features to the SVG container
				svgPath = map.selectAll("path")
					.data(countries)
					.enter().append("path")
					.attr("d", path)
					.attr("id",  function(d) { return d.properties.name })
					.attr("stroke", "#fff")
					.on("click", function (event, d) {
						// 'this' refers to the clicked path element
						const clickedElement = event.target;
						// Get the bounding box of the element
						const bbox = clickedElement.getBBox();

						// Extract the x and y coordinates from the bounding box
						const x = bbox.x;
						const y = bbox.y;
						console.log(window.length);

						console.log( d3.select("#" + d.properties.name).node());
						const annotations = [
							{
							note: { label: d.properties.name },
							x: x ,
							y: y  * 1.1,
							dy:50,
							dx: 100,
							color: "black",
							subject: { radius: 0, radiusPadding: 0 },
							},
						];

						d3.select("svg").selectAll(".annotation-group").remove();

						displayTableOnDemand(  d.properties.name);
						// Perform your desired actions here based on the clcked country
					})
					.on ('mouseover',  function( d ) {
						var GDP = 0;
						Object.keys(GDPdata).forEach ( function (key) {
								if (GDPdata[key]['Country Name'].includes(d.srcElement.id)) {
									 GDP = GDPdata[key]['2022 [YR2022]'];
								}
						})
						tooltip.selectAll('p').remove();
						tooltip.style("visibility", "visible").append('p').text(d.srcElement.id).attr("dy", "0em");
 						tooltip.style("visibility", "visible").append('p').text(GDP ?' GDP: ' + formatNumberWithUnits(GDP) : 'Not Available').attr("dy", "1em").attr("font-size", '10px');
						tooltip.style("visibility", "visible").append('p').text(" 🖱️ → 🔍 ").attr("dy", "2em");

					} )
					.on("mousemove", function(event){
						return tooltip.style("top", (event.pageY * 1.1 )+"px").style("left",(event.pageX  * 1.1)+"px");})
					.on("mouseout", function(){return tooltip.style("visibility", "hidden");})
					.attr("fill",  function (d) {
						var inflationValue = 0;
						for  ( i =0; i  < mappedData.length; i ++ ) {
								if ( mappedData[i].countryName.includes(d.properties.name) ) {
									inflationValue = mappedData[i].inflationValue;
								}
						}
						if (inflationValue !== null) {
						if (inflationValue < 3) {
							return '#3c3'; // Light green for inflation < 3
						} else if (inflationValue >= 3 && inflationValue <= 8) {
							return '#fc0'; // Yellow for inflation between 3 and 8
						} else if (inflationValue > 8 && inflationValue <= 16) {
							return '#fa5'; // Orange for inflation between 8 and 16
						} else {
							return '#f00'; // Red for inflation > 16
						}
						}
					});
				}

				function displayTableOnDemand (  countryName) {
					var exCols = ['Country Name','Country Code','Indicator Name','Indicator Code'];
					clearTimeout(updateTimer);
					d3.select('#myTable tbody').innerHTML = '';
					tbody.selectAll('tr').remove();
					// Update the table contents
					var tableRow  = tbody.append("tr");
					var avgInflation = 0;
					var numYears = 0;
					var gdp ;
					var percentage;
					var previousYear ;
					var previousinflation ;
					Object.keys(inflationData).forEach ( function(key) {

						if (key.includes(countryName)) {
							gdp = GDPdata[ inflationData[key] ['Country Code']] ['2022 [YR2022]'];
							percentage = ((gdp - GDPdata[ inflationData[key] ['Country Code']] ['1990 [YR1990]']) / GDPdata[ inflationData[key] ['Country Code']] ['1990 [YR1990]']) * 100
							previousYear = ((GDPdata[ inflationData[key] ['Country Code']] ['2022 [YR2022]'] - GDPdata[ inflationData[key] ['Country Code']] ['2021 [YR2021]']) / GDPdata[ inflationData[key] ['Country Code']] ['2021 [YR2021]']) * 100

							for ( i in headers ) {
								tableRow.append("td").text(inflationData[key][headers[i]]);
								if  (! ( exCols.includes(headers[i])))  {
										if (inflationData[key]['2022'] != '') {
											previousinflation = ((inflationData[key]['2022']  - inflationData[key]['2021']) );
										}
										if( ( inflationData[key][headers[i]]) === "") {
											avgInflation+=0 ;
											continue;
										}
										else{
											avgInflation += parseFloat(inflationData[key][headers[i]] );
											numYears ++;
											continue;
										}
								}

							}
						}

					})
					console.log( formatNumberWithUnits(gdp));
					var detailsDiv = d3.select('.detailsOnDemand')
					detailsDiv.selectAll("details").remove();
					var details = detailsDiv.append("details");
					details.append("summary").text("More Details");
					details.append("p").text( avgInflation != 0 ? "Average Inflation Rate from '60-'22: " + (avgInflation/ numYears).toFixed(2) + '%': " Inflation Data Not Available");
					details.append("p").text(   previousinflation.toFixed(2) > 0 ?     '     Annual inflation rate: ' +  previousinflation.toFixed(2) + '% ⬆️' :  '     Annual inflation rate: ' +  previousinflation.toFixed(2) + '% ⬇️' );
 					details.append("p").text('      2022 GDP: ' + formatNumberWithUnits(gdp) + ' 🏦 ');
					details.append("p").text ("     % Change GDP growth: " + percentage.toFixed(2) + '% ⬆️' + '1990 - 2022')
					details.append("p").text ("     % Annual GDP growth: " + previousYear.toFixed(2) + '% ⬆️')
					details.selectAll("p").attr("margin-left", '10px');

				}
				// generate Year range

				const yearRange = d3.select("#yearRange");
				for ( i = 1960; i <= 2022; i ++ ) {
					yearRange.append("option").attr("value", i).text(i);
				}


				yearRange.on('change', handleSelectChange);

				function handleSelectChange () {
					const selectedValue = yearRange.property('value');
					reColor(selectedValue);
				};

				function filterDataByYear(headers) {

					var filterData = [];
					console.log(headers);
					inflationData.forEach( function(row) {
							headers.forEach ( function ( c ) {
								filterData.push (row);
						})
					})
					return filterData;
 				};
				function formatNumberWithUnits(number) {
					// Define the units and their respective divisors
					const units = ["", "K", "M", "B", "T"];
					const divisor = 1000;

					// Loop through the units and divide the number until it's less than the divisor
					let unitIndex = 0;
					while (number >= divisor && unitIndex < units.length - 1) {
					  number /= divisor;
					  unitIndex++;
					}

					// Format the number with the unit and return as a string
					return  String ( number.toFixed(2) + " " + units[unitIndex]);
				  }

}