/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
  describe("When I click on new bill button", () => {
    test("Then it should open a page to create a new bill", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Importation du mock localstorage d'employé
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      //  Création d'un nouveau container pour les factures
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: null,
      });
      // Rempli le form avec des données mock
      document.body.innerHTML = BillsUI({ data: bills });
      const handleClickButton = jest.fn((e) =>
        billsContainer.handleClickNewBill()
      ); // Click sur le bouton
      const newBillButton = screen.getByTestId("btn-new-bill");
      // Ecoute le click du bouton pour créer une facture
      newBillButton.addEventListener("click", handleClickButton);
      userEvent.click(newBillButton);
      // S'attends à ce que le boutton soit appelé
      expect(handleClickButton).toHaveBeenCalled();
      // S'attends à une valeur "vraie" quand l'id "form-new-bill" est affiché
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });
  });

  describe("When I click on the icon eye", () => {
    test("A modal should open", () => {
      jQuery.fn.modal = jest.fn();

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = BillsUI({
        data: bills,
      });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const billspage = new Bills({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      });

      const iconEye = screen.getAllByTestId("icon-eye");
      const handleClickIconEye = jest.fn(() =>
        billspage.handleClickIconEye(iconEye[0])
      );

      if (iconEye)
        iconEye.forEach((icon) => {
          icon.addEventListener("click", handleClickIconEye);
        });
      userEvent.click(iconEye[0]);

      expect(handleClickIconEye).toHaveBeenCalled();
      expect(handleClickIconEye).toHaveReturnedTimes(1);
    });
  });
});
