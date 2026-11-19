FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["PortafolioDeEvidencias/PortafolioDeEvidencias.csproj", "PortafolioDeEvidencias/"]
RUN dotnet restore "PortafolioDeEvidencias/PortafolioDeEvidencias.csproj"

COPY . .
WORKDIR /src/PortafolioDeEvidencias

RUN dotnet publish "PortafolioDeEvidencias.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000

EXPOSE 10000

ENTRYPOINT ["dotnet", "PortafolioDeEvidencias.dll"]