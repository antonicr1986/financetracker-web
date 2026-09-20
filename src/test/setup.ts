import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeAll(() => {
  // jsdom no implementa <dialog> de forma fiable: segun la version,
  // showModal() no existe o no marca el elemento como abierto. Los dialogos de
  // la aplicacion son nativos a proposito, asi que se suple aqui lo justo para
  // poder probarlos, sin cambiar el componente para que sea testeable.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };

  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});
