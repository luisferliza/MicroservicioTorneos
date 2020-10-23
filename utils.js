const uuid = require('uuid')

module.exports = {

    randomizeTournaments: function (playersArray) {
        let playersRealArray = []
        playersArray.forEach(element => {
            playersRealArray.push(element.id_jugador)
        });
        return this.createIdentifiers(this.shuffle(playersRealArray));


    },

    shuffle: function (array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    },

    createIdentifiers: function (players) {
        let uids = []
        let nextStack = []
        cont = 2;
        for (let index = 1; index < players.length; index++) {
            if (nextStack.length == 0) {
                let match = { first_player: -1, second_player: -1, next_key: null, id: uuid.v4(), order: index }
                uids.unshift(match)
                nextStack.push(match.id)
            } else {
                let match = { first_player: -1, second_player: -1, next_key: nextStack[0], id: uuid.v4(), order: index }
                uids.unshift(match)
                nextStack.push(match.id)
                cont--;
                if (cont == 0) {
                    cont = 2;
                    nextStack.shift();
                }
            }
        }

        for (let cont1 = 0, cont2 = 0; cont1 < players.length; cont1 += 2, cont2++) {
            uids[cont2].first_player = players[cont1];
            uids[cont2].second_player = players[cont1 + 1];
        }
        return uids;
    }

};