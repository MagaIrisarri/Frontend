const fs = require('fs');
const path = require('path');

function fixDisaster(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content
        .replace(/Ú/g, 's')
        .replace(/ÑO/g, "'O")
        .replace(/ÓN/g, '"N');
        
    // Now re-fix the genuine Spanish words that I broke
    const fixWords = {
        "DUE'O": "DUEÑO",
        "Navegaci\"N": "Navegación",
        "NAVEGACI\"N": "NAVEGACIÓN",
        "Autenticacin": "Autenticación",
        "vehculos": "vehículos",
        "Vehculos": "Vehículos",
        "Pestaas": "Pestañas",
        "Pblicas": "Públicas",
        "Dueo": "Dueño",
        "dueo": "dueño",
        "Administracin": "Administración",
        "sesin": "sesión",
        "Sesin": "Sesión",
        "vehculo": "vehículo",
        "Vehculo": "Vehículo",
        "Configuracin": "Configuración",
        "Aadir": "Añadir",
        "contrasea": "contraseña",
        "Contrasea": "Contraseña",
        "diseo": "diseño",
        "Diseo": "Diseño",
        "ubicacin": "ubicación",
        "Ubicacin": "Ubicación",
        "direccin": "dirección",
        "Direccin": "Dirección",
        "informacin": "información",
        "Informacin": "Información",
        "descripcin": "descripción",
        "Descripcin": "Descripción",
        "estacin": "estación",
        "Estacin": "Estación",
        "opcin": "opción",
        "Opcin": "Opción",
        "atencin": "atención",
        "Atencin": "Atención"
    };

    for (const [bad, good] of Object.entries(fixWords)) {
        content = content.split(bad).join(good);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed disaster in:', filePath);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            fixDisaster(fullPath);
        }
    }
}

walkDir('./src');
