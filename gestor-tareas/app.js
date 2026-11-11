const readline = require('readline-sync');
const fs = require('fs');
const path = require('path');

const ARCHIVO = path.join(__dirname, 'tasks.json');

const LETRA_A_ESTADO = { P: 'PENDING', E: 'IN-PROGRESS', T: 'FINISHED', C: 'CANCELED' };
const estadoALetra = (estado) => Object.keys(LETRA_A_ESTADO).find(l => LETRA_A_ESTADO[l] === estado);

let tareas = [];

function fechaValida(f) {
    return typeof f === 'string' && f.trim() !== '' && !isNaN(Date.parse(f));
}

function validarTarea(t) {
    const errores = [];
    if (typeof t !== 'object' || t === null || Array.isArray(t)) return ['no es un objeto'];
    if (typeof t.titulo !== 'string' || t.titulo.trim() === '') errores.push('titulo obligatorio');
    if (!fechaValida(t.creacion)) errores.push('creacion obligatoria y valida');
    if (t.descripcion != null && typeof t.descripcion !== 'string') errores.push('descripcion invalida');
    if (!Object.values(LETRA_A_ESTADO).includes(t.estado)) errores.push('estado invalido');
    if (t.ultimaEdicion != null && !fechaValida(t.ultimaEdicion)) errores.push('ultimaEdicion invalida');
    if (t.vencimiento != null && !fechaValida(t.vencimiento)) errores.push('vencimiento invalido');
    if (![1, 2, 3].includes(t.dificultad)) errores.push('dificultad invalida');
    return errores;
}

function cargarTareas() {
    let datos;
    try {
        datos = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
    } catch (error) {
        console.log(`No se pudo leer tasks.json: ${error.message}`);
        return;
    }
    if (!Array.isArray(datos)) {
        console.log("tasks.json debe contener un array de tareas.");
        return;
    }

    datos.forEach((t, i) => {
        const errores = validarTarea(t);
        if (errores.length > 0) {
            console.log(`Tarea #${i + 1} descartada: ${errores.join(', ')}`);
        } else {
            tareas.push({
                titulo: t.titulo,
                descripcion: t.descripcion ?? null,
                estado: t.estado,
                creacion: t.creacion,
                ultimaEdicion: t.ultimaEdicion ?? null,
                vencimiento: t.vencimiento ?? null,
                dificultad: t.dificultad
            });
        }
    });

    console.log(`\nSe cargaron ${tareas.length} tareas de ${datos.length} (${datos.length - tareas.length} invalidas).`);
}

function guardarTareas() {
    fs.writeFileSync(ARCHIVO, JSON.stringify(tareas, null, 2), 'utf8');
}

function pedirEstado(mensaje) {
    const validos = ['P', 'E', 'T', 'C'];
    while (true) {
        let entrada = readline.question(mensaje).trim().toUpperCase();
        if (validos.includes(entrada)) {
            return LETRA_A_ESTADO[entrada];
        }
        console.log("Estado invalido. Opciones: P, E, T, C.");
    }
}

function pedirDificultad(mensaje) {
    while (true) {
        let entrada = readline.questionInt(mensaje);
        if (entrada >= 1 && entrada <= 3) {
            return entrada;
        }
        console.log("Dificultad invalida. Debe ser 1, 2 o 3.");
    }
}

function pedirVencimiento(mensaje) {
    while (true) {
        const entrada = readline.question(mensaje).trim();
        if (entrada === '') return null;
        if (fechaValida(entrada)) return entrada;
        console.log("Fecha invalida. Ejemplo: 2026-12-31");
    }
}

function mostrarTarea(tarea, id) {
    console.log(`ID: ${id} | Nombre: ${tarea.titulo} | Estado: [${estadoALetra(tarea.estado)}] | Dificultad: ${tarea.dificultad}`);
    console.log(`Descripcion: ${tarea.descripcion ?? '-'} | Vencimiento: ${tarea.vencimiento ?? '-'}\n`);
}

function editarTarea(tarea) {
    console.log("(Enter = mantener el valor actual, '-' = dejar vacio en descripcion/vencimiento)");

    const nombre = readline.question(`Nuevo nombre [${tarea.titulo}]: `).trim();
    if (nombre !== '') tarea.titulo = nombre;

    const desc = readline.question(`Nueva descripcion [${tarea.descripcion ?? '-'}]: `).trim();
    if (desc === '-') tarea.descripcion = null;
    else if (desc !== '') tarea.descripcion = desc;

    const estado = readline.question(`Nuevo estado ([P]endiente / [E]n curso / [T]erminada / [C]ancelada) [${estadoALetra(tarea.estado)}]: `).trim().toUpperCase();
    if (LETRA_A_ESTADO[estado]) tarea.estado = LETRA_A_ESTADO[estado];

    const venc = readline.question(`Nuevo vencimiento [${tarea.vencimiento ?? '-'}]: `).trim();
    if (venc === '-') tarea.vencimiento = null;
    else if (venc !== '') {
        if (fechaValida(venc)) tarea.vencimiento = venc;
        else console.log("Fecha invalida, se mantiene la anterior.");
    }

    const dif = readline.question(`Nueva dificultad (1 / 2 / 3) [${tarea.dificultad}]: `).trim();
    if (['1', '2', '3'].includes(dif)) tarea.dificultad = Number(dif);

    tarea.ultimaEdicion = new Date().toISOString();
    guardarTareas();
    console.log("\nTarea editada con exito.\n");
}

cargarTareas();

let opcion;
do {
    console.log("\nMENU PRINCIPAL\n");
    console.log(" [1] Ver Mis Tareas");
    console.log(" [2] Buscar una Tarea");
    console.log(" [3] Agregar una Tarea");
    console.log(" [0] Salir.\n");

    opcion = readline.questionInt("> ");

    switch (opcion) {
        case 1: {
            let subopcion;
            do {
                console.log("\nMIS TAREAS\n");
                console.log(" [1] Todas");
                console.log(" [2] Pendientes");
                console.log(" [3] En curso");
                console.log(" [4] Terminadas");
                console.log(" [5] Canceladas\n");
                console.log(" [0] Volver\n");

                subopcion = readline.questionInt("> ");

                if (subopcion >= 1 && subopcion <= 5) {
                    console.log("\nLISTA DE TAREAS");
                    let encontrado = false;

                    tareas.forEach((tarea, i) => {
                        const coincide =
                            subopcion === 1 ||
                            (subopcion === 2 && tarea.estado === 'PENDING') ||
                            (subopcion === 3 && tarea.estado === 'IN-PROGRESS') ||
                            (subopcion === 4 && tarea.estado === 'FINISHED') ||
                            (subopcion === 5 && tarea.estado === 'CANCELED');

                        if (coincide) {
                            mostrarTarea(tarea, i + 1);
                            encontrado = true;
                        }
                    });

                    if (!encontrado) {
                        console.log("No se encontraron tareas en esta categoria.");
                    } else {
                        const id_editar = readline.questionInt("\nIngresa el ID de la tarea a editar (o presiona 0 para volver): ");

                        if (id_editar !== 0) {
                            const tareaAEditar = tareas[id_editar - 1];

                            if (tareaAEditar) {
                                console.log(`\n[Modificando Tarea ID ${id_editar}]`);
                                editarTarea(tareaAEditar);
                            } else {
                                console.log("\nNo se encontro ninguna tarea con ese ID.\n");
                            }
                        }
                    }
                }
            } while (subopcion !== 0);
            break;
        }

        case 2: {
            let subopcion;
            do {
                console.log("\nBUSCAR TAREA\n");
                const id_tarea = readline.questionInt("Inserta el ID de la tarea (o presiona 0 para volver): ");

                if (id_tarea === 0) break;

                const tarea = tareas[id_tarea - 1];
                if (tarea) {
                    console.log("\nTarea Encontrada:");
                    mostrarTarea(tarea, id_tarea);
                } else {
                    console.log("No se encontro ninguna tarea con ese ID.");
                }

                subopcion = readline.questionInt("\nPresiona 0 para volver al menu principal u otro numero para seguir buscando: ");
            } while (subopcion !== 0);
            break;
        }

        case 3: {
            console.log("\nAGREGAR TAREA\n");
            let nombre;
            do {
                nombre = readline.question("Nombre: ").trim();
                if (nombre === '') console.log("El nombre es obligatorio.");
            } while (nombre === '');

            const descripcion = readline.question("Descripcion (Enter = vacia): ").trim();

            const nuevaTarea = {
                titulo: nombre,
                descripcion: descripcion === '' ? null : descripcion,
                estado: pedirEstado("Estado ([P]endiente / [E]n curso / [T]erminada / [C]ancelada): "),
                creacion: new Date().toISOString(),
                ultimaEdicion: null,
                vencimiento: pedirVencimiento("Vencimiento (ej: 2026-12-31, Enter = ninguno): "),
                dificultad: pedirDificultad("Dificultad (1 / 2 / 3): ")
            };

            tareas.push(nuevaTarea);
            guardarTareas();
            console.log("\nTarea guardada con exito.\n");
            break;
        }

        case 0:
            guardarTareas();
            console.log("\nPrograma finalizado.");
            break;

        default:
            console.log("\nOpcion invalida.\n");
    }
} while (opcion !== 0);
