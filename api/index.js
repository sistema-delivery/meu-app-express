app.post('/mp-pix', async (req, res) => {
  const { valor, nome, email } = req.body;
  if (!valor) {
    return res.status(400).json({ message: 'Valor é obrigatório' });
  }

  const payment_data = {
    transaction_amount: valor,
    description: "Cobrança via Pix",
    payment_method_id: "pix",
    payer: {
      email: email || "cliente@example.com",
      first_name: nome || "Cliente"
    }
  };

  try {
    const paymentResponse = await mercadopago.payment.create(payment_data);
    const { transaction_data } = paymentResponse.body.point_of_interaction;
    const { qr_code, qr_code_base64, ticket_url } = transaction_data;

    res.json({
      message: 'Pagamento criado com sucesso!',
      copia_e_cola: qr_code,                                 // string para copiar e colar
      qr_code_base64: `data:image/png;base64,${qr_code_base64}`, // imagem pronta para <img src="...">
      ticket_url,                                           // opcional: link para visualização/impressão
      payment: paymentResponse.body
    });
  } catch (err) {
    console.error('Erro ao criar pagamento no Mercado Pago:', err);
    res.status(500).json({ message: 'Erro ao criar pagamento', error: err.message });
  }
});
