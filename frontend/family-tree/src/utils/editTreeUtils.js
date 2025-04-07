import * as d3 from "d3";
import f3 from "family-chart";
import { VIEW_FIELDS, EDIT_FIELDS } from "../constants/constants";

export const closeFormContainer = () => {
  const formContainer = document.querySelector(".f3-form-cont");
  if (formContainer) {
    d3.select(formContainer).classed("opened", false).html("");
  }
};

export const configureEditTreeForm = (editTreeInstance) => {
  const originalOpen = editTreeInstance.open.bind(editTreeInstance);

  editTreeInstance.open = function (datum) {
    if (datum.data.data) datum = datum.data;

    const isEditMode =
      this.editFirst ||
      datum._new_rel_data ||
      d3.select(this.form_cont).classed("edit-mode");

    // console.log("Opening form, isEditMode:", isEditMode); // Commented out for production

    this.setFields(isEditMode ? EDIT_FIELDS : VIEW_FIELDS);
    originalOpen(datum);
  };

  editTreeInstance.setFields(VIEW_FIELDS);
  editTreeInstance.setOnChange(() => {
    const form = d3.select(editTreeInstance.form_cont).select("form");
    if (form.node()) {
      const isEditable = form.classed("editable");
      // console.log("Form state changed, isEditable:", isEditable); // Commented out for production

      d3.select(editTreeInstance.form_cont).classed("edit-mode", isEditable);
      editTreeInstance.setFields(isEditable ? EDIT_FIELDS : VIEW_FIELDS);
    }
  });
};

export const configureAddRelative = (editTreeInstance, isAdmin, relTypes) => {
  editTreeInstance.addRelative = (datum) => {
    if (!isAdmin) {
      console.log("Add Relative blocked: User is not an admin");
      return;
    }

    // console.log("=== Add Relative Initiated ==="); // Commented out for production
    // console.log("Datum passed to addRelative:", JSON.stringify(datum, null, 2)); // Commented out for production

    if (editTreeInstance.isAddingRelative()) {
      // console.log("AddRelative is active, cancelling previous action..."); // Commented out for production
      const addRelativeInstance = editTreeInstance.addRelativeInstance;
      if (
        addRelativeInstance &&
        typeof addRelativeInstance.onCancel === "function"
      ) {
        addRelativeInstance.onCancel();
      } else {
        console.warn("onCancel is not a function, performing manual reset...");
        addRelativeInstance.is_active = false;
        addRelativeInstance.store_data = null;
        addRelativeInstance.datum = null;
        addRelativeInstance.onChange = null;
        addRelativeInstance.onCancel = null;
        editTreeInstance.store.updateTree({});
      }
    }

    const formCreator = f3.handlers.createForm({
      store: editTreeInstance.store,
      datum: { id: "rel-type-selector", data: {} },
      fields: [
        {
          type: "select",
          label: "Relationship Type",
          id: "relType",
          options: relTypes.map((type) => ({
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1),
          })),
          required: true,
        },
      ],
      postSubmit: (e) => {
        const formData = new FormData(e.target);
        const relType = formData.get("relType");
        if (relType) {
          const defaultGender =
            relType === "father" || relType === "son" ? "M" : "F";
          const tempDatum = {
            ...datum,
            data: {
              ...datum.data,
              gender: defaultGender,
            },
          };
          editTreeInstance.addRelativeInstance.activate(tempDatum, relType);
        }
      },
      onCancel: closeFormContainer,
    });

    const formCont = f3.handlers.formInfoSetup(formCreator, closeFormContainer);

    const formContainer = document.querySelector(".f3-form-cont");
    if (formContainer) {
      formContainer.innerHTML = "";
      formContainer.appendChild(formCont);
      d3.select(formContainer).classed("opened", true);
    }
  };
};

export const configureEditTree = (
  editTreeInstance,
  cardInstance,
  transformedTree,
  addRelLabels,
  isAdmin
) => {
  editTreeInstance.setEditFirst(false);

  editTreeInstance.setAddRelLabels(addRelLabels);
  editTreeInstance.setCardClickOpen(cardInstance);
  editTreeInstance.fixed();

  if (isAdmin && transformedTree.length > 0) {
    editTreeInstance.openFormWithId(transformedTree[0].id);
  }
};
