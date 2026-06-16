fetch("weight.json")
  .then(r => r.json())
  .then(({ records, goal, unit }) => {
    const container = document.getElementById("weightTable");

    const rows = records
      .slice()
      .reverse()
      .map(({ date, weight }) => {
        const diff = (weight - goal).toFixed(1);
        return `
          <tr>
            <td>${date}</td>
            <td>${weight} ${unit}</td>
            <td>${diff > 0 ? "+" : ""}${diff} ${unit}</td>
          </tr>
        `;
      })
      .join("");

    container.innerHTML = `
      <table style="width:fit-content">
        <thead>
          <tr>
            <th>日期</th>
            <th>体重</th>
            <th>距目标</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  });