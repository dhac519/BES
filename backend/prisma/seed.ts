import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ENCRYPTION_KEY = "12345678901234567890123456789012"; // 32 chars — debe coincidir con .env
const IV_LENGTH = 16;

function encryptSol(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function main() {
  console.log('\n====================================');
  console.log('   BES - Seed de Base de Datos      ');
  console.log('====================================\n');

  // 1. CREAR SUPER ADMIN
  console.log('📋 Paso 1: Creando Super Admin...');
  const hashedPassword = await bcrypt.hash('Admin1234!', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@bes.com' },
    update: {},
    create: {
      email: 'admin@bes.com',
      password: hashedPassword,
      nombre: 'Administrador BES',
      rol: 'SUPER_ADMIN',
    }
  });
  console.log(`✅ Super Admin listo: ${admin.email} / Admin1234!\n`);

  // 2. CREAR EMPRESAS
  console.log('📋 Paso 2: Cargando empresas...');

  const empresas = [
    { razonSocial: 'JADAMI S.A.C.',                                         ruc: '20551902910', usuarioSol: 'ISTOCLIA',  claveSol: 'Jadami123'     },
    { razonSocial: "PARADA 90'S S.R.L.",                                    ruc: '20609648300', usuarioSol: '45032279',  claveSol: 'Parada123'     },
    { razonSocial: 'ARYP SERVICIOS GENERALES E.I.R.L.',                     ruc: '20614898870', usuarioSol: '61025533',  claveSol: 'Reyes123'      },
    { razonSocial: 'KRICASA E.I.R.L.',                                      ruc: '20612668320', usuarioSol: '43575764',  claveSol: 'Kricasa2025'   },
    { razonSocial: 'PASANNI S.R.L.',                                        ruc: '20600615140', usuarioSol: 'PASSANNI',  claveSol: 'PASANNIWGC'    },
    { razonSocial: 'MEJIAS PEREZ ABRAHAN ENRIQUE',                          ruc: '15614447220', usuarioSol: 'EUREQUAY',  claveSol: 'Mejias81'      },
    { razonSocial: 'ENTRECOSTILLAS E.I.R.L.',                               ruc: '20607426211', usuarioSol: '45441646',  claveSol: 'ECostillas01'  },
    { razonSocial: 'SERVICIOS MULTIPLES J A HERMANOS S.R.L.',               ruc: '20600938551', usuarioSol: 'JAHERMAN',  claveSol: 'JaHerm01'      },
    { razonSocial: 'SERVICIOS GENERALES INGMER S.A.C.',                     ruc: '20614544491', usuarioSol: '18866982',  claveSol: '1085Ingemer'   },
    { razonSocial: 'FAST DENTAL ESTHETIC E.I.R.L.',                         ruc: '20610331581', usuarioSol: '70136474',  claveSol: 'Stefano27F'    },
    { razonSocial: 'TEG&T TECNICOS ESPECIALISTAS EN GEOSINTETICOS S.A.C.', ruc: '20606249081', usuarioSol: 'AIRGINOT',  claveSol: '48208375Cris'  },
  ];

  let creadas = 0;
  for (const emp of empresas) {
    try {
      await prisma.empresa.upsert({
        where: { ruc: emp.ruc },
        update: {
          razonSocial: emp.razonSocial,
          usuarioSol: emp.usuarioSol,
          claveSol: encryptSol(emp.claveSol),
          usuarioId: admin.id,
        },
        create: {
          razonSocial: emp.razonSocial,
          ruc: emp.ruc,
          usuarioSol: emp.usuarioSol,
          claveSol: encryptSol(emp.claveSol),
          usuarioId: admin.id,
        }
      });
      console.log(`  ✅ ${emp.razonSocial} (${emp.ruc})`);
      creadas++;
    } catch (err: any) {
      console.error(`  ❌ Error con ${emp.ruc}: ${err.message}`);
    }
  }

  console.log(`\n====================================`);
  console.log(`✅ Seed completado: ${creadas}/${empresas.length} empresas`);
  console.log(`👤 Login: admin@bes.com / Admin1234!`);
  console.log(`====================================\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
