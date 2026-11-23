/* 
 
 
async function cargarActividades() {

    const respuesta = await fetch("/Actividad/ObtenerTodas");
    const actividades = await respuesta.json();

    const contenedor = document.querySelector(".actividades-card .card-body");

    contenedor.innerHTML = "<h5 class='card-title mb-3'>Actividades registradas</h5>";

    if (actividades.length === 0) {
        contenedor.innerHTML += `
            <div class="text-center py-5">
                <h5 class="text-muted">No hay actividades para mostrar</h5>
                <p class="text-muted">Agrega una actividad a uno de tus viajes.</p>
            </div>`;
        return;
    }

    contenedor.innerHTML += `
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>Actividad</th>
                    <th>Viaje</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${actividades.map(a => `
                    <tr>
                        <td>${a.nombre}</td>
                        <td>${a.viajeId}</td>
                        <td>${formatearFechaActividad(a.fecha)}</td>
                        <td>${a.completada ? "Completada" : "Pendiente"}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-2"
                                onclick="editarActividad(${a.actividadId})">Editar</button>
                            <button class="btn btn-sm btn-outline-danger"
                                onclick="eliminarActividad(${a.actividadId})">Eliminar</button>
                        </td>
                    </tr>`).join("")}
            </tbody>
        </table>`;
}


async function cargarViajes() {

    const respuesta = await fetch("/Actividad/ObtenerViajes");
    const viajes = await respuesta.json();
    const select = document.getElementById("viajeId");

    select.innerHTML = '<option value="">Selecciona un viaje</option>';

    viajes.forEach(v => {
        select.innerHTML += `<option value="${v.viajeId}">${v.nombre} - ${v.ciudadDestino}</option>`;
    });

}

async function editarActividad(id) {

    const respuesta = await fetch(`/Actividad/ObtenerPorId/${id}`);
    actividadSeleccionada = await respuesta.json();

    await cargarViajes();

    const a = actividadSeleccionada;

    document.getElementById("actividadId").value = a.actividadId;
    document.getElementById("viajeId").value = a.viajeId;
    document.getElementById("nombre").value = a.nombre;
    document.getElementById("descripcion").value = a.descripcion ?? "";
    document.getElementById("fecha").value = a.fecha.substring(0, 10);
    document.getElementById("completada").checked = a.completada;

    document.getElementById("tituloModalActividad").textContent = "Editar Actividad";
    document.getElementById("btnGuardarActividad").textContent = "Actualizar Actividad";

    bootstrap.Modal.getOrCreateInstance(
        document.getElementById("modalActividad")
    ).show();

}


async function eliminarActividad(id) {

    if (!confirm("¿Deseas eliminar esta actividad?")) return;

    const respuesta = await fetch(`/Actividad/Eliminar?id=${id}`, {
        method: "DELETE"
    });

    if (respuesta.ok) {
        alert("Actividad eliminada correctamente.");
        cargarActividades();
    } else {
        alert("No se pudo eliminar la actividad.");
    }

}


function formatearFechaActividad(fecha) {

    const partes = fecha.substring(0, 10).split("-");

    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}
 














 
 */