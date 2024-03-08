/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  // Utilitaire pour configurer le localStorage avant chaque test
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
  });

  describe("When I am on NewBill Page", () => {
    // Test pour vérifier si l'icône de mail est activée sur la page NewBill
    test("then mail icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");

      expect(mailIcon.classList).toContain("active-icon");
    });

    // Test pour vérifier si le formulaire est correctement affiché
    test("Then the form should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      expect(screen.getByTestId("form-new-bill")).toBeInTheDocument();
      expect(screen.getByTestId("expense-type")).toBeInTheDocument();
      expect(screen.getByTestId("expense-name")).toBeInTheDocument();
      expect(screen.getByTestId("datepicker")).toBeInTheDocument();
      expect(screen.getByTestId("amount")).toBeInTheDocument();
      expect(screen.getByTestId("vat")).toBeInTheDocument();
      expect(screen.getByTestId("pct")).toBeInTheDocument();
      expect(screen.getByTestId("commentary")).toBeInTheDocument();
      expect(screen.getByTestId("file")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("When I fill the form ", () => {
    let newBill;

    beforeEach(() => {
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
    });

    describe("When I upload a file", () => {
      let handleChangeFile;

      beforeEach(() => {
        handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      });

      // Test pour vérifier si le bon fichier est sélectionné
      test("right file should be selected", async () => {
        await waitFor(() => screen.getByTestId("file"));
        const inputFile = screen.getByTestId("file");

        inputFile.addEventListener("change", handleChangeFile);
        const testFile = new File(["test"], "test.jpg", { type: "image/jpg" });
        fireEvent.change(inputFile, {
          target: {
            files: [testFile],
          },
        });

        expect(screen.getByTestId("file").files[0].name).toBe("test.jpg");
        expect(handleChangeFile).toHaveBeenCalled();
        expect(inputFile.files[0]).toEqual(testFile);
      });

      // Test pour vérifier la sélection d'un fichier
      test("a file should be selected", async () => {
        const mockEvent = {
          preventDefault: jest.fn(),
          target: {
            value: "fakepath\\fakefile.jpg",
            files: [
              new File(["fileContent"], "fakefile.jpg", { type: "image/jpeg" }),
            ],
          },
        };

        handleChangeFile(mockEvent);

        expect(handleChangeFile).toHaveBeenCalled();
      });

      // Test pour vérifier que l'événement handleChangeFile est déclenché
      test("then handleChangeFile should be triggered ", async () => {
        await waitFor(() => screen.getByTestId("file"));
        const inputFile = screen.getByTestId("file");

        inputFile.addEventListener("change", handleChangeFile);

        const testFile = new File(["test"], "test.jpg", { type: "image/jpg" });

        fireEvent.change(inputFile, {
          target: {
            files: [testFile],
          },
        });

        expect(screen.getByTestId("file").files[0].name).toBe("test.jpg");
        expect(handleChangeFile).toHaveBeenCalled();
        expect(inputFile.files[0]).toEqual(testFile);
      });

      // Test pour vérifier si le téléchargement d'un mauvais fichier déclenche une erreur
      test("then upload a wrong file should trigger an error", async () => {
        const inputFile = screen.getByTestId("file");

        inputFile.addEventListener("change", handleChangeFile);

        const testFile = new File(["test"], "test.pdf", {
          type: "document/pdf",
        });

        const errorSpy = jest.spyOn(console, "error");

        fireEvent.change(inputFile, {
          target: {
            files: [testFile],
          },
        });

        expect(errorSpy).toHaveBeenCalledWith("Invalid file extension");
      });
    });

    describe("When I click on the submit button", () => {
      // Test pour vérifier la création d'une nouvelle facture
      test("then it should create a new bill", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

        const mockLocalStorage = {
          getItem: jest.fn(() => JSON.stringify({ email: "test@example.com" })),
        };

        const mockStore = {
          bills: jest.fn(() => ({
            create: jest.fn(() => Promise.resolve()),
          })),
        };

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const mockOnNavigate = jest.fn();

        const newBill = new NewBill({
          document,
          onNavigate: mockOnNavigate,
          store: mockStore,
          localStorage: mockLocalStorage,
        });

        const sampleBill = {
          type: "Transports",
          name: "Vol Paris-Brest",
          date: "2024-02-10",
          amount: 42,
          vat: "10",
          pct: 15,
          commentary: "test bill",
          status: "pending",
          fileName: "image.jpg",
        };

        screen.getByTestId("expense-type").value = sampleBill.type;
        screen.getByTestId("expense-name").value = sampleBill.name;
        screen.getByTestId("datepicker").value = sampleBill.date;
        screen.getByTestId("amount").value = sampleBill.amount;
        screen.getByTestId("vat").value = sampleBill.vat;
        screen.getByTestId("pct").value = sampleBill.pct;
        screen.getByTestId("commentary").value = sampleBill.commentary;
        newBill.fileName = sampleBill.fileName;

        newBill.updateBill = jest.fn();
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        expect(handleSubmit).toHaveBeenCalled();
        expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
      });
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Dashboard);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Dashboard);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
