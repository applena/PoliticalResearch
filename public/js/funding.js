'use strict';

let ctx = document.getElementById('fundingChart').getContext('2d');

//let dummyData = [ { name: 'Morgan & Morgan', total: '113400' }, { name: 'League of Conservation Voters', total: '98310' }, { name: 'Microsoft Corp', total: '90320' }, { name: 'Amazon.Com', total: '60335' }, { name: 'University of Washington', total: '54955' }, { name: 'Boeing Co', total: '54019' }, { name: 'Zillow Inc', total: '42450' }, { name: 'Emily\'s List', total: '41011' }, { name: 'Fisher Investments', total: '25400' }, { name: 'Valve Corp', total: '24650' } ];

let labels = [];
let data = [];

function getData () {
  console.log('in getData on funding.js');
  $.get('http://localhost:3000/data/1')
    .then (json => {
      console.log(json);

      makeChart(json.vote);
      drawChart();
    })
}

function makeChart (arr) {
  arr.map(contributor => {
    return labels.push(contributor.name);
  })
  arr.map(contributor => {
    return data.push(contributor.total);
  })
}

console.log(labels);
console.log(data);

function drawChart () {
  let chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Canidate Funding',
        data: data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(265, 169, 64, 0.2)',
          'rgba(275, 199, 132, 0.2)',
          'rgba(64, 62, 235, 0.2)',
          'rgba(265, 06, 86, 0.2)',
          'rgba(85, 92, 192, 0.2)'
        ],
        borderColor: [
          'rgba(255,99,132,1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255,99,132,1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {}
  });
}

getData();
