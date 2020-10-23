const express = require('express');
const bodyParser = require('body-parser');
var utils = require('./utils')
var mysql = require('mysql');
var cors = require('cors')
const app = express();
app.use(cors())
const ip = process.env.IP || "172.17.0.2";
const port =  process.env.PORT || 3000;
const pass =  process.env.PASS || "000000";
const user =  process.env.USER || "root";
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var connection = mysql.createPool({
    connectionLimit: 30,
    host: ip,
    port: 3306,
    user: user,
    password: pass,
    database: 'practica'
});



app.get('/', (req, res) => {
    res.status(200).send({ "message": `Todo OK` });

});


app.post('/torneos', (req, res) => {
    if (!req.body.nombre) {
        res.status(400).send({ message: 'No se encontró el atributo nombre' });
    }
    else if (!req.body.juego) {
        res.status(400).send({ message: 'No se encontró el atributo nombre' });
    }
    else if (!req.body.participantes) {
        res.status(400).send({ message: 'No se encontró el atributo nombre' });
    } else {
        connection.query(`INSERT INTO TORNEO(nombre, juego, participantes) 
                        values ('${req.body.nombre}', '${req.body.juego}', ${req.body.participantes})`,
            function (err) {
                if (err) {
                    res.status(500).send({ message: 'Error de conexion a BD' })
                    console.log(err);
                } else {
                    res.status(200).send({ message: 'Registro insertado correctamente' });
                }
            });
    }
});

app.get('/torneos', (req, res) => {
    connection.query(`Select t.*, e.nombre as estado
                      from torneo  as t, estado as e
                      where t.id_estado = e.id_estado;`,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            }
            res.status(200).send(result);
        });

});

app.get('/torneos/:id', (req, res) => {
    connection.query(`Select t.*, e.nombre as estado
                      from torneo  as t, estado as e
                      where t.id_estado = e.id_estado and t.id_torneo=${req.params.id}`,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            }
            res.status(200).send(result[0]);
        });

});

app.put('/torneos/:id', (req, res) => {
    connection.query(` Update torneo
                       set nombre = '${req.body.nombre}',
                       juego = '${req.body.juego}',
                       id_ganador = ${req.body.id_ganador},
                       id_estado = ${req.body.id_estado}
                        where id_torneo = ${req.params.id}`,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            } else {
                res.status(200).send({});
            }
        });
});

app.delete('/torneos/:id', (req, res) => {
    connection.query(` delete from torneo 
                        where id_torneo = ${req.params.id}`,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            } else {
                res.status(200).send(result);
            }
        });
});

app.get('/torneos/futuros/:usuario', (req, res) => {
    const query = `call MisProximosTorneos(${req.params.usuario})`;
    connection.query(query,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            }
            res.status(200).send(result[0]);
        });
});

app.get('/torneos/pasados/:usuario', (req, res) => {
    const query = `call MisTorneosPasados(${req.params.usuario})`;
    connection.query(query,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            }
            res.status(200).send(result[0]);
        });
});

app.get('/torneos/activos/:usuario', (req, res) => {
    const query = `call MisTorneosActivos(${req.params.usuario})`;
    connection.query(query,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            }
            res.status(200).send(result[0]);
        });
});

app.post('/torneos/registrar', (req, res) => {
    const query = `call InscribirParticipante(${req.body.id_usuario}, ${req.body.id_torneo})`;
    connection.query(query,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            }
            res.status(201).send();
        });
});

app.post('/torneos/randomize', (req, res) => {
    connection.query(`Select * from participante 
                      where id_torneo = ${req.body.id}`,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            } else {
                let brackets = []
                brackets = utils.randomizeTournaments(result)
                brackets.forEach(match => {
                    createBrackets(match, req.body.id)
                })
                setReadyState(req.body.id)
                res.status(200).send({});
            }

        });

});

/*
########################################
Permisos
########################################
*/



app.get('/permisos/:id', (req, res) => {
    connection.query(`Select * from permisos
                        where id_rol=${req.params.id}`,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            }
            res.status(200).send(result);
        });
});



/*
#########################
###### PARTIDAS #########
#########################
*/
// Es un POST para no utilizar dos parámetros
app.post('/torneos/jugar', (req, res) => {
    connection.query(`Select * from partida 
                    where (id_jugador1 = ${req.body.jugador} or id_jugador2 =${req.body.jugador}) 
                    and (resultado_jugador1 = 0 and resultado_jugador2 = 0) 
                    and id_torneo = ${req.body.torneo}
                    order by ronda desc;`,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            }
            res.status(200).send(result);
        });
});

app.get('/partidas/:id', (req, res) => {
    connection.query(`Select * from partida
                        where id_torneo=${req.params.id}`,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            }
            res.status(200).send(result);
        });
});

app.put('/partidas/:id', (req, res) => {
    if (req.body.marcador && req.params.id) {
        if (req.body.marcador.length == 2) {
            connection.query(`call DeclararGanador(${req.body.marcador[0]}, ${req.body.marcador[1]}, '${req.params.id}')`,
                function (err, result) {
                    if (err) {
                        res.status(500).send({ message: 'Error de conexion a BD' })
                        console.log(err);
                    } else {
                        res.status(201).send();
                    }
                });
        } else {
            res.status(406).send();
        }
    } else {
        res.status(406).send();
    }
});

app.put('/registrar', (req, res) => {
    console.log('Entre')
    let quer = `update partida
    set id_estado = 2
    where id_partida = '${req.body.id}'`
    console.log(quer)
    connection.query(quer,
        function (err, result) {
            if (err) {
                res.status(500).send({ message: 'Error de conexion a BD' })
                console.log(err);
            } else {
                res.status(201).send();
            }
        });
});

app.listen(port, () => {
    console.log(`API Rest corriendo en http://localhost:${port}`);

});

function createBrackets(match, id) {
    connection.query(`insert into partida (id_partida, id_torneo, id_jugador1, id_jugador2, llave_siguiente, ronda)  
                                        values('${match.id}', ${id}, ${match.first_player}, ${match.second_player}, '${match.next_key}', ${match.order})`,
        function (err, result) {
            if (err) {
                console.log(`Error ${err} en la partida ${match.id}`)
            }

        });
}

function setReadyState(id_tournament) {
    connection.query(`update torneo
                        set id_estado = 2
                        where id_torneo = ${id_tournament}  
                    `,
        function (err, result) {
            if (err) {
                console.log(`Error ${err} modificando el estado del torneo`)
            }

        });
}

