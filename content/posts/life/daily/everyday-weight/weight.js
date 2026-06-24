fetch("/posts/life/daily/everyday-weight/weight.json")
  .then(r => r.json())
  .then(({ records, goal }) => {
    const labels  = records.map(r => r.date);
    const weights = records.map(r => r.weight);

    new Chart(document.getElementById("weightChart"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Weight 体重 kg",
            data: weights,
            borderColor: "#4f86c6",
            backgroundColor: "rgba(79,134,198,0.1)",
            tension: 0.4,
            fill: true,
            pointRadius: 5,
          },
          {
            label: "Goal 目标",
            data: Array(labels.length).fill(goal),
            borderColor: "#e87040",
            borderDash: [6, 4],
            pointRadius: 0,
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { suggestedMin: goal - 1 }
        }
      }
    });
  });