document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.querySelector('#pedidos-table tbody');

  try {
    const response = await fetch('/api/admin/orders');
    const pedidos = await response.json();

    pedidos.forEach(pedido => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${pedido._id}</td>
        <td>${pedido.cliente || 'Sem nome'}</td>
        <td>${pedido.endereco || 'Sem endereço'}</td>
        <td>R$ ${pedido.total?.toFixed(2) || '0,00'}</td>
        <td>${pedido.status || 'Pendente'}</td>
        <td class="actions">
          <button class="approve">Aprovar</button>
          <button class="cancel">Cancelar</button>
        </td>
      `;

      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    tableBody.innerHTML = '<tr><td colspan="6">Erro ao carregar os pedidos.</td></tr>';
  }
});
