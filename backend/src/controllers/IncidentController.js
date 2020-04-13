const connection = require('../database/connection');

module.exports = {
    async index(request, response) {
        const { page = 1 } = request.query;

        const [count]/*pega apenas o número e nn a array */ = await connection('incidents').count();


        const incidents = await connection('incidents')
            .join('ongs', 'ongs.id', '=', 'incidents.ong_id') /*junta informações do caso com informações da ong (pra mostrar whatsapp, email etc)*/
            .limit(5)
            .offset((page - 1) * 5) //esquema de paginação//
            .select(['incidents.*', 'ongs.name', 'ongs.email', 'ongs.whatsapp', 'ongs.city', 'ongs.uf']); /*separa os dados corretamente*/

        response.header('X-Total-Count', count['count(*)']); /*Mostra no cabeçalho o total de casos (independente da página)*/

        response.header('X-Pages-Count', Math.ceil(count['count(*)'] / 5)); /*Mostra no cabeçalho o total de paginas*/


        return response.json(incidents);
    },

    async create(request, response) {
        const { title, description, value } = request.body;
        const ong_id = request.headers.authorization;

        const [id] = await connection('incidents').insert({
            title,
            description,
            value,
            ong_id,
        });

        return response.json({ id });
    },

    async delete(request, response) {
        const { id } = request.params;
        const ong_id = request.headers.authorization;

        const incident = await connection('incidents')
            .where('id', id)
            .select('ong_id')
            .first();

        if (incident.ong_id != ong_id) {
            return response.status(401).json({ error: 'Operation not permitted.' })
        }

        await connection('incidents').where('id', id).delete();

        return response.status(204).send();
    }

};