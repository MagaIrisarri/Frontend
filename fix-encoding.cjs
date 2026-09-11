const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content
        .replace(/Ã¡/g, 'á')
        .replace(/Ã©/g, 'é')
        .replace(/Ã³/g, 'ó')
        .replace(/Ãº/g, 'ú')
        .replace(/Ã±/g, 'ñ')
        .replace(/Ã‘/g, 'Ñ')
        .replace(/Ã­/g, 'í')
        .replace(/'O/g, 'ÑO')
        .replace(/"N/g, 'ÓN')
        .replace(/s/g, 'Ú');
        
    const replacements = {
        "DUE'O": 'DUEÑO',
        "DUEǸO": 'DUEÑO',
        "DUE'O": 'DUEÑO',
        "Dueo": 'Dueño',
        "dueo": 'dueño',
        "Administracin": 'Administración',
        "sesin": 'sesión',
        "Sesin": 'Sesión',
        "vehculo": 'vehículo',
        "Vehculo": 'Vehículo',
        "Configuracin": 'Configuración',
        "Aadir": 'Añadir',
        "contrasea": 'contraseña',
        "Contrasea": 'Contraseña',
        "diseo": 'diseño',
        "Diseo": 'Diseño',
        "ubicacin": 'ubicación',
        "Ubicacin": 'Ubicación',
        "direccin": 'dirección',
        "Direccin": 'Dirección',
        "informacin": 'información',
        "Informacin": 'Información',
        "descripcin": 'descripción',
        "Descripcin": 'Descripción',
        "estacin": 'estación',
        "Estacin": 'Estación',
        "opcin": 'opción',
        "Opcin": 'Opción',
        "atencin": 'atención',
        "Atencin": 'Atención',
        'Navegaci"N': 'Navegación',
        'NAVEGACI"N': 'NAVEGACIÓN',
        'NAVEGACI"N': 'NAVEGACIÓN',
        'Navegacin': 'Navegación',
        'MENs': 'MENÚ',
        'MENs': 'MENÚ',
        'Menǧ': 'Menú',
        'OfrecǸ': 'Ofrecé',
        'catǭlogos': 'catálogos',
        'Dueo': 'Dueño'
    };

    for (const [bad, good] of Object.entries(replacements)) {
        content = content.split(bad).join(good);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', filePath);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            fixFile(fullPath);
        }
    }
}

walkDir('./src');
