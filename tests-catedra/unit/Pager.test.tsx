// @vitest-environment jsdom
// Componente Pager: rango visible, botones anterior y siguiente, bordes, estado ocupado y que no aparezca con una sola página.
// Correr: pnpm test
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Pager } from '../../src/components/Owner/ui/Pager';

afterEach(cleanup);

const prev = () => screen.getByRole('button', { name: 'Página anterior' }) as HTMLButtonElement;
const next = () => screen.getByRole('button', { name: 'Página siguiente' }) as HTMLButtonElement;

describe('Pager', () => {
  it('no aparece si todo entra en una página', () => {
    const { container } = render(<Pager page={1} limit={25} total={25} onPage={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('muestra el rango de la página y pide la anterior o la siguiente', () => {
    const onPage = vi.fn();
    render(<Pager page={2} limit={25} total={120} onPage={onPage} />);
    expect(screen.getByRole('navigation', { name: 'Paginación' }).textContent).toContain('26–50 de 120');
    fireEvent.click(prev());
    fireEvent.click(next());
    expect(onPage.mock.calls).toEqual([[1], [3]]);
  });

  it('en la primera página no hay anterior y en la última no hay siguiente', () => {
    const { rerender } = render(<Pager page={1} limit={25} total={120} onPage={() => {}} />);
    expect([prev().disabled, next().disabled]).toEqual([true, false]);
    rerender(<Pager page={5} limit={25} total={120} onPage={() => {}} />);
    expect(screen.getByRole('navigation').textContent).toContain('101–120 de 120');
    expect([prev().disabled, next().disabled]).toEqual([false, true]);
  });

  it('mientras carga no deja cambiar de página', () => {
    const onPage = vi.fn();
    render(<Pager page={2} limit={25} total={120} busy onPage={onPage} />);
    expect([prev().disabled, next().disabled]).toEqual([true, true]);
    fireEvent.click(next());
    expect(onPage).not.toHaveBeenCalled();
  });
});
