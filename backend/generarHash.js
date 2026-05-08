import bcryptjs from 'bcryptjs';

const password = '123456';
const saltRounds = 10;

async function main() {
  const hash = await bcryptjs.hash(password, saltRounds);
  console.log(hash);
}

main().catch((error) => {
  console.error('Error generando hash:', error);
  process.exit(1);
});
