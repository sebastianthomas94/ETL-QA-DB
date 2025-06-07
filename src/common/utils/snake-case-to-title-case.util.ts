export const snakeCaseToTitleCase = (statusCodeName: string) => {
    const formattedMessage = statusCodeName
        .split("_")
        .map((v) => v[0].toUpperCase() + v.slice(1))
        .join(" ");
    return formattedMessage;
};
