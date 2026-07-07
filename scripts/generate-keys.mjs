import { generateKeyPairSync } from 'crypto';
import { writeFileSync } from 'fs';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

writeFileSync('private.pem', privateKey.export({ type: 'pkcs1', format: 'pem' }));
writeFileSync('public.pem', publicKey.export({ type: 'pkcs1', format: 'pem' }));
console.log('wrote private.pem and public.pem');
