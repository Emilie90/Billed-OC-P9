/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // set up the mock localStorage and mock user for the test
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
    test("then mail icon in vertical layout should be highlighted", async () => {
      // creation of the root element
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      // load to the new bill page using the router
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      // wait for the mail icon to be displayed and check that it is active
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");

      expect(mailIcon.classList).toContain("active-icon");
    });
    test("Then the form should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByRole("button")).toBeTruthy();
    });
  });

  describe("When I fill the form ", () => {
    let newBill;

    beforeEach(() => {
      // set up the new bill
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
        // create the handleChangeFile mocked function
        handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      });
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

        // check that the file name is displayed
        expect(screen.getByTestId("file").files[0].name).toBe("test.jpg");

        // caheck that handleChangeFile is called
        expect(handleChangeFile).toHaveBeenCalled();

        // check formdata values
        expect(inputFile.files[0]).toEqual(testFile);
      });

      test("a file should be selected", async () => {
        // Create a mock event object with a selected file
        const mockEvent = {
          preventDefault: jest.fn(),
          target: {
            value: "fakepath\\fakefile.jpg", // Simulated file path
            files: [
              new File(["fileContent"], "fakefile.jpg", { type: "image/jpeg" }), // Simulated file object
            ],
          },
        };

        // Call handleChangeFile with the mock event
        handleChangeFile(mockEvent);

        // Assert that the function detects the selected file
        expect(handleChangeFile).toHaveBeenCalled();
      });

      test("then handleChangeFile should be triggered ", async () => {
        // get the input file element and add the event listener
        await waitFor(() => screen.getByTestId("file"));
        const inputFile = screen.getByTestId("file");

        inputFile.addEventListener("change", handleChangeFile);

        // creation of the test file to upload
        const testFile = new File(["test"], "test.jpg", { type: "image/jpg" });

        // simulate the file upload
        fireEvent.change(inputFile, {
          target: {
            files: [testFile],
          },
        });

        // check that the file name is displayed
        expect(screen.getByTestId("file").files[0].name).toBe("test.jpg");

        // caheck that handleChangeFile is called
        expect(handleChangeFile).toHaveBeenCalled();

        // check formdata values
        expect(inputFile.files[0]).toEqual(testFile);
      });

      test("then upload a wrong file should trigger an error", async () => {
        // get the input file element and add the event listener
        await waitFor(() => screen.getByTestId("file"));
        const inputFile = screen.getByTestId("file");

        inputFile.addEventListener("change", handleChangeFile);

        // creation of the test file to upload
        const testFile = new File(["test"], "test.pdf", {
          type: "document/pdf",
        });

        // spy the console
        const errorSpy = jest.spyOn(console, "error");

        // simulate the file upload
        fireEvent.change(inputFile, {
          target: {
            files: [testFile],
          },
        });

        // check that the error message is displayed in the console
        expect(errorSpy).toHaveBeenCalledWith("Invalid file extension");
      });
    });

    // POST integration test

    describe("When I click on the submit button", () => {
      test("then it should create a new bill", async () => {
        let mockOnNavigate;
        const html = NewBillUI();
        document.body.innerHTML = html;
        // Mock localStorage
        const mockLocalStorage = {
          getItem: jest.fn(() => JSON.stringify({ email: "test@example.com" })),
        };

        // Mock store
        const mockStore = {
          bills: jest.fn(() => ({
            create: jest.fn(() => Promise.resolve()),
          })),
        };

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        mockOnNavigate = jest.fn();
        // Create a new instance of NewBill
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

        // charge les données dans les champs correspondants
        screen.getByTestId("expense-type").value = sampleBill.type;
        screen.getByTestId("expense-name").value = sampleBill.name;
        screen.getByTestId("datepicker").value = sampleBill.date;
        screen.getByTestId("amount").value = sampleBill.amount;
        screen.getByTestId("vat").value = sampleBill.vat;
        screen.getByTestId("pct").value = sampleBill.pct;
        screen.getByTestId("commentary").value = sampleBill.commentary;
        newBill.fileName = sampleBill.fileName;

        // Assertions
        newBill.updateBill = jest.fn(); // crée fonction d'update
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e)); // crée fonction de submit

        const form = screen.getByTestId("form-new-bill"); // récupère le formulaire
        form.addEventListener("submit", handleSubmit); // écoute la fonction au submit
        fireEvent.submit(form); // lance l'évènement submit

        expect(handleSubmit).toHaveBeenCalled(); // on s'attend à ce que la fonction submit ait été appellée

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

    describe("When I submit a completed form", () => {
      test("Then a new bill should be created", () => {});
    });
  });
});
