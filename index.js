//
// CS 416 - Data Visualization - By Kevin Nguyen
//
//
//

function loadData ( ) {

	const slider = document.getElementById('slider1');
	slider.addEventListener('input', updateSliderValue);
	slider.addEventListener('mouseup', displayTableOnDemand);




	var countriesTable = {};
	let updateTimer; // Debouncing timer
	var inflationData =  {};
	var cols = '';
	var thead = ' '
	var table  = d3.select("table");
	var tbody;
	var headers;

	function updateSliderValue() {
		clearTimeout(updateTimer);
		const sliderValue = document.getElementById('slider-value');
		sliderValue.innerHTML = `Range: ${slider.value}`;
		console.log(slider.value);
		updateTimer = setTimeout(displayTableOnDemand, 200); // Adjust the delay as needed

	  }


	d3.csv('./Inflation_Consumer_Prices/data.csv').then( function(data) {
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
		console.log(inflationData);
		data.forEach( function(row) {
			var tableRow  = tbody.append("tr");
			countriesTable[row['Country Name']] = row['Country Code'];
			inflationData [ row['Country Name']]  = row;
			columns.forEach( function (column){
			 	tableRow.append("td")
			 	.text(row[column]);
			 });
		})
	})




	const width = 800;
	const height = 1100;

	console.log (inflationData);
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
	d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((data) => {
	  // Convert TopoJSON to GeoJSON
	      countries = topojson.feature(data, data.objects.countries).features;
	  map = svg.append("g");

	  reColor("2022");
	  console.log(mappedData);
	  // Create a group for the map features

	  // Add the map features to the SVG container

	//   const annotations = [
	// 	{
	// 	  note: { label: "Hi How are you ?" },
	// 	  x: 500,
	// 	  y: 100,
	// 	  dy: 137,
	// 	  dx: 162,
	// 	  subject: { radius: 50, radiusPadding: 10 },
	// 	},
	//   ];


	//   d3.select("svg")
	// 	.append("g")
	// 	.attr("class", "annotation-group")
	// 	.call(d3.annotation().annotations(annotations));

	  map.selectAll("path")
		.data(countries)
		.enter().append("path")
		.attr("d", path)
		.attr("stroke", "#fff")
		.on("click", function (event, d) {
			// 'this' refers to the clicked path element

			displayTableOnDemand( d.properties.name);
			// Perform your desired actions here based on the clicked country
		  })
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

	  // Add the map features to the SVG container
	  map.selectAll("path")
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
			  d3.select("svg")
				.append("g")
				.attr("class", "annotation-group")
				.call(d3.annotation().annotations(annotations));
			displayTableOnDemand( d.properties.name);
			// Perform your desired actions here based on the clicked country
		  })
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
		Object.keys(inflationData).forEach ( function(key) {
			 if (key.includes(countryName)) {
				for ( i in headers ) {
					tableRow.append("td").text(inflationData[key][headers[i]]);
					if  (! ( exCols.includes(headers[i])))  {
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




		//  tbody.selectAll("details").remove();
		var detailsDiv = d3.select('.detailsOnDemand')
		detailsDiv.selectAll("details").remove();
		var details = detailsDiv.append("details");
		details.append("summary").text("More Details");
		details.append("p").text( avgInflation != 0 ? 'Average Inflation Rate from 1960 - 2022: ' + (avgInflation/ numYears).toFixed(2) + '%': "Not Available");

		//  tab.append("th").text( avgInflation != 0 ? 'Average Inflation Rate from 1960 - 2022: ' + (avgInflation/ numYears).toFixed(2) + '%': "Not Available");

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
	}

	function filterDataByYear(headers) {

		var filterData = [];
		console.log(headers);
		inflationData.forEach( function(row) {
				headers.forEach ( function ( c ) {
					filterData.push (row);
			})
		})
		return filterData;
 }
}
