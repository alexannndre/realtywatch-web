import { Group, Modal, Box, Button } from "@mantine/core";
import { useSession } from "next-auth/react";
import { type AxiosErrorResponse, type Collection } from "~/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { makeRequest, processAxiosError } from "~/lib/requestHelper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea, TextInput as TextInputForm } from "react-hook-form-mantine";
import { useEffect, useState } from "react";
import { successNotification } from "../PropertyCard";

type CollectionResponse = {
  message: string;
  data: Collection;
};

const schema = z.object({
  title: z
    .string()
    .nonempty({ message: "A title is required" })
    .min(1, { message: "Title must be at least 1 character long" })
    .max(100, { message: "Title must be at most 100 characters long" }),
  description: z.string().max(5000, { message: "Description must be at most 5000 characters long" }),
});

type FormSchemaType = z.infer<typeof schema>;

const defaultDefaultValues: FormSchemaType = {
  title: "",
  description: "",
};

type EditCollectionProps = {
  collection: Collection | null;
  collections: Collection[];
  modalOpened: boolean;
  close: () => void;
};

export function EditCollection({ collection: collectionInput, collections, modalOpened, close }: EditCollectionProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [defaultValues, setDefaultValues] = useState<FormSchemaType>(defaultDefaultValues);

  const { control, handleSubmit, reset, setError } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const [collection, setCollection] = useState<Collection | null>(null);

  useEffect(() => {
    setCollection(collectionInput);
    const newDefault = {
      title: collectionInput?.name ?? "",
      description: collectionInput?.description ?? "",
    };
    setDefaultValues(newDefault);
    reset(newDefault);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionInput, reset]);

  const [dataProcessing, setDataProcesing] = useState<FormSchemaType>(defaultDefaultValues);

  const updateCollection = async (data: FormSchemaType) => {
    if (!collection?.id) return;
    const formData = new FormData();

    formData.append("name", data.title);

    if (data.description) {
      formData.append("description", data.description);
    } else {
      formData.append("description", "");
    }

    setDataProcesing(data);

    return (await makeRequest(
      `me/lists/${collection.id}`,
      "PUT",
      session?.user.access_token,
      formData,
      false,
      false
    )) as Promise<CollectionResponse>;
  };

  const { mutate } = useMutation({
    mutationFn: updateCollection,
    onSuccess: () => {
      if (collection?.id) {
        const col = collections.findIndex((col) => col.id === collection.id);
        if (col != -1 && collections && collections[col]) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          collections[col].name = dataProcessing?.title ?? "";
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          collections[col].description = dataProcessing?.description ?? "";
        }
      }
      close();
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
      void queryClient.invalidateQueries({ queryKey: ["collectionsSidebar"] });
      successNotification("Collection edited successfully");
    },
    onError: (error: AxiosErrorResponse) => {
      if (error.response?.status === 409) {
        setError("title", {
          type: "custom",
          message: "A collection with that name already exists",
        });
        return;
      }
      processAxiosError(error, "An error occurred while editing the collection");
    },
  });

  return (
    <>
      <Modal opened={modalOpened} onClose={close} title="Edit Collection">
        <form
          /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
          onSubmit={handleSubmit((data) => mutate(data))}
        >
          <Box maw={320} mx="auto">
            <TextInputForm
              label="Title"
              defaultValue={collection?.name ?? ""}
              name="title"
              control={control}
              mb="xs"
              withAsterisk
            />
            <Textarea
              label="Description"
              defaultValue={collection?.description ?? ""}
              name="description"
              control={control}
              autosize
              minRows={2}
              maxRows={4}
            />

            <Group position="center" mt="lg">
              <Button type="submit">Edit Collection</Button>
            </Group>
          </Box>
        </form>
      </Modal>
    </>
  );
}
