'use strict';

let ctx = document.getElementById('fundingChart').getContext('2d');

let dummyData = [ Contributor { name: 'Morgan & Morgan', total: '113400' },
Contributor { name: 'League of Conservation Voters', total: '98310' },
Contributor { name: 'Microsoft Corp', total: '90320' },
Contributor { name: 'Amazon.Com', total: '60335' },
Contributor { name: 'University of Washington', total: '54955' },
Contributor { name: 'Boeing Co', total: '54019' },
Contributor { name: 'Zillow Inc', total: '42450' },
Contributor { name: 'Emily\'s List', total: '41011' },
Contributor { name: 'Fisher Investments', total: '25400' },
Contributor { name: 'Valve Corp', total: '24650' } ];

let labels = [];
let data = [];

function makeChart (array) {
  
}

makeChart(dummyData);

let chart = new Chart(ctx, {
  // The type of chart we want to create
  type: 'dognut',

  // The data for our dataset
  data: {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [{
      label: 'My First dataset',
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: 'rgb(255, 99, 132)',
      data: [0, 10, 5, 2, 20, 30, 45],
    }]
  },

  // Configuration options go here
  options: {}
});

//////////dummy data//////////
// [ Contributor { name: 'Morgan & Morgan', total: '113400' },
//   Contributor { name: 'League of Conservation Voters', total: '98310' },
//   Contributor { name: 'Microsoft Corp', total: '90320' },
//   Contributor { name: 'Amazon.Com', total: '60335' },
//   Contributor { name: 'University of Washington', total: '54955' },
//   Contributor { name: 'Boeing Co', total: '54019' },
//   Contributor { name: 'Zillow Inc', total: '42450' },
//   Contributor { name: 'Emily\'s List', total: '41011' },
//   Contributor { name: 'Fisher Investments', total: '25400' },
//   Contributor { name: 'Valve Corp', total: '24650' } ]
