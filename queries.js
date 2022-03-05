module.exports = {
    constructGetMembersQuery: (req) => {
        const { sort = 'id%asc', word = '%member_name', limit } = req.query;

        const sortFrom = sort.split('%')[0];
        const sortBy = sort.split('%')[1];
        const sortQuery = `order by ${sortFrom} ${sortBy}`;

        let searchQuery = `where `;
        const wordList = word.split(',');
        (wordList || []).forEach((word, index) => {
            const searchStr = word.split('%')[0];
            const searchFrom = word.split('%')[1];
            if (wordList.length - 1 !== index) {
                searchQuery += `${searchFrom} like '%${searchStr}%' and `;
            } else {
                searchQuery += `${searchFrom} like '%${searchStr}%' `;
            }
        });

        const limitQuery = `limit ${limit}`;

        let Query = `select * from name_list ${searchQuery} ${sortQuery}`;
        if (limit) {
            Query = `${Query} ${limitQuery};`;
        } else {
            Query = Query + `;`;
        }
        return Query;
    },
    getQueryVariables: (query, condition) => {
        const { sort = 'id%asc', word = '%member_name', limit } = query;

        const sortFrom = sort.split('%')[0];
        const sortBy = sort.split('%')[1];
        const sortQuery = `order by ${sortFrom} ${sortBy}`;

        let searchQuery =
            condition === 'online'
                ? `where (detail_list.address NOT LIKE '%dindigul%') and `
                : condition === 'offline'
                    ? `WHERE (detail_list.address IS NULL OR detail_list.address LIKE '%dindigul%') and `
                    : `where `;
        const wordList = word.split(',');
        wordList.forEach((word, index) => {
            const searchStr = word.split('%')[0];
            let searchFrom = word.split('%')[1];
            if (searchFrom === 'id') {
                searchFrom = 'name_list.id';
            }
            if (wordList.length - 1 !== index) {
                searchQuery += `${searchFrom} like '%${searchStr}%' and `;
            } else {
                searchQuery += `${searchFrom} like '%${searchStr}%' `;
            }
        });

        const limitQuery = limit ? `limit ${limit}` : null;
        return { sortQuery, limitQuery, searchQuery };
    },
    constructAddQuery: (req) => {
        let NameQuery = `insert into name_list (id, member_name, member_name) values (${req.id}, ${req.member_name}, ${req.father_name});`;
        let DetailsQuery = `insert into detail_list (id, address, phone, whatsapp, email_id, descendant, marital_status, spouse_name, gher_navu, gothru, dob, photo, custom_field) values (${req.id
            }, ${req.address}, ${req.phone}, ${req.whatsapp}, ${req.email_id
            }, ${req.descendant}, ${req.marital_status}, ${req.spouse_name
            }, ${req.gher_navu}, ${req.gothru}, ${req.dob}, ${req.photo
            }, ${req.custom_field}, ${new Date()});`;
        return { NameQuery, DetailsQuery };
    }
}