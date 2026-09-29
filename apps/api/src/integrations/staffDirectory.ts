/**
 * Fonte de dados de quem trabalha no escritório (equipe interna).
 *
 * Hoje implementada com dados mockados. Quando a API real for conectada —
 * seja o próprio ADVBOX (que já tem um cadastro de usuários/advogados) ou
 * um diretório de funcionários separado — basta trocar
 * `MockStaffDirectoryClient` por uma implementação que consulte essa fonte,
 * mantendo a mesma interface `StaffDirectoryClient`.
 *
 * IMPORTANTE: não existe (nem deve existir) cadastro manual de funcionário
 * dentro do portal. Assim que a pessoa aparecer na fonte de dados real, ela
 * já consegue entrar — o "cadastro" é automático, no primeiro login. A
 * identificação usa CPF OU telefone (o que for mais fácil para a pessoa
 * lembrar) + data de nascimento (DDMM), no mesmo padrão do login do
 * cliente. Isso evita depender de alguém do escritório lembrar de criar
 * uma conta manualmente toda vez que é contratada uma pessoa nova.
 */
import {
  mockStaffUsers,
  onlyDigits,
  birthDateToDDMM,
  type StaffUser,
} from "@portal/shared";

export interface StaffDirectoryClient {
  getStaffByIdentifierAndBirthDate(
    identifier: string,
    birthDateDDMM: string
  ): Promise<StaffUser | null>;
}

/**
 * Compara só os últimos 11 dígitos (DDD + número), pois o telefone
 * cadastrado costuma incluir o código do país (+55) e a pessoa digita só
 * o número local no login.
 */
function samePhone(a: string, b: string): boolean {
  const da = onlyDigits(a).slice(-11);
  const db = onlyDigits(b).slice(-11);
  return da.length === 11 && da === db;
}

class MockStaffDirectoryClient implements StaffDirectoryClient {
  async getStaffByIdentifierAndBirthDate(
    identifier: string,
    birthDateDDMM: string
  ): Promise<StaffUser | null> {
    const idDigits = onlyDigits(identifier);
    const staff = mockStaffUsers.find(
      (s) => onlyDigits(s.cpf) === idDigits || samePhone(s.phone, identifier)
    );
    if (!staff || birthDateToDDMM(staff.birthDate) !== birthDateDDMM) return null;
    return staff;
  }
}

export const staffDirectory: StaffDirectoryClient = new MockStaffDirectoryClient();
