import { describe, it, expect } from 'vitest';
import { registrationSchema } from '@/lib/registration';
const valid = { kind:'new', customerType:'private', name:'ישראל ישראלי', identity:'123456789', mobile:'0501234567', email:'', city:'הוד השרון', street:'החרש', house:'5', postal:'4520000', pobox:'', floor:'0', apartment:'0', phone:'',fax:'',unloading:'coordinate',notes:'',contact:{},requestedPermissions:[],consent:true,website:'' };
describe('Customer intake rules', () => {
  it('requires a full name or business name', () => { expect(registrationSchema.safeParse({...valid,name:''}).success).toBe(false); });
  it('requires a 9 digit identifier', () => { expect(registrationSchema.safeParse({...valid,identity:'123'}).success).toBe(false); expect(registrationSchema.safeParse(valid).success).toBe(true); });
  it.each(['city','street','house','postal'])('requires shipping %s', key => { expect(registrationSchema.safeParse({...valid,[key]:''}).success).toBe(false); });
  it.each(['floor','apartment'])('requires unloading %s', key => { expect(registrationSchema.safeParse({...valid,[key]:''}).success).toBe(false); });
  it('accepts ground-floor delivery', () => { expect(registrationSchema.safeParse(valid).success).toBe(true); });
  it('requires consent before submission', () => { expect(registrationSchema.safeParse({...valid,consent:false}).success).toBe(false); });
  it('rejects honeypot submissions', () => { expect(registrationSchema.safeParse({...valid,website:'spam'}).success).toBe(false); });
});