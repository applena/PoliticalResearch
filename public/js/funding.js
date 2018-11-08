'use strict';

let ctx = document.getElementById('fundingChart').getContext('2d');
let id = $('.repid').text();
let labels = [];
let data = [];

function getData () {
  // $.get(`http://localhost:3000/data/${id}`) \\for local testing only
  $.get(`https://politicalresearch301.herokuapp.com/data/${id}`)
    .then (json => {
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

function drawChart () {
  let chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Candidate Funding',
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
