// /controllers/usuarioController.js
const db = require('../models');
const { Usuario } = db;
const { Op } = require('sequelize');

exports.getUsuariosPorTipo = async (req, res) => {
  const { tipo } = req.query;
  if (!tipo) return res.status(400).json({ msg: 'Parâmetro "tipo" é obrigatório.' });

  try {
    const tiposPermitidos = Array.isArray(tipo) ? tipo : tipo.split(',');
    const usuarios = await Usuario.findAll({
      where: { tipo: { [Op.in]: tiposPermitidos } },
      attributes: ['id', 'nome', 'email', 'tipo'],
    });
    res.json(usuarios);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

// ✅ GET /api/usuarios/me
exports.getMeuUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'nome', 'email', 'tipo'],
    });
    if (!usuario) return res.status(404).json({ msg: 'Usuário não encontrado.' });
    res.json(usuario);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

// ✅ PUT /api/usuarios/me
exports.updateMeuUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) return res.status(404).json({ msg: 'Usuário não encontrado.' });

    const { nome, email } = req.body;

    // Atualiza apenas campos permitidos
    if (nome !== undefined) usuario.nome = nome;
    if (email !== undefined) usuario.email = email;

    await usuario.save();

    res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ msg: 'Este e-mail já está em uso.' });
    }
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};
