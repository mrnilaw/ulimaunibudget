let ingresos = 0;
let gastos = 0;

document.addEventListener("DOMContentLoaded", function() {
  const btn = document.getElementById("btnAgregar");
  btn.addEventListener("click", agregarRegistro);
});

function agregarRegistro() {
  const descripcion = document.getElementById('descripcion').value.trim();
  const monto = parseFloat(document.getElementById('monto').value);
  const tipo = document.getElementById('tipo').value;
  const lista = document.getElementById('lista');

  if (!descripcion || isNaN(monto)) {
    alert('Por favor, ingresa una descripción y un monto válido.');
    return;
  }

  const li = document.createElement('li');
  li.textContent = `${descripcion}: S/. ${monto.toFixed(2)} (${tipo})`;
  lista.appendChild(li);

  if (tipo === 'ingreso') {
    ingresos += monto;
  } else {
    gastos += monto;
  }

  actualizarTotales();

  document.getElementById('descripcion').value = '';
  document.getElementById('monto').value = '';
}

function actualizarTotales() {
  document.getElementById('totalIngresos').textContent = ingresos.toFixed(2);
  document.getElementById('totalGastos').textContent = gastos.toFixed(2);
  document.getElementById('balance').textContent = (ingresos - gastos).toFixed(2);
}
