const marineService = require('../services/marineService');

const getFauna = async (req, res) => {
  try {
    const fauna = await marineService.getFaunaDataBrazil();
    res.status(200).json(fauna);
  } catch (error) {
    console.error('[Erro em getFauna]', error);
    res.status(500).json({ message: 'Erro ao buscar dados da fauna marinha' });
  }
};

module.exports = { getFauna };

