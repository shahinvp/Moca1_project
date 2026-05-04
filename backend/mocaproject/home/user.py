from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .serializers import user_serializer
from home.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = user_serializer.RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        return Response({
            "message": "Registered successfully. Wait for admin approval",
            "user_id": user.id
        }, status=201)

    return Response({
        "message": "Registration failed",
        "errors": serializer.errors
    }, status=400)




@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):

    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if not user:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_approved:
        return Response(
            {"error": "Account not approved by admin"},
            status=status.HTTP_403_FORBIDDEN
        )

    token, _ = Token.objects.get_or_create(user=user)

    # Common response for React
    response_data = {
        "message": "Login successful",
        "token": token.key,
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
    }

    # If manager, send employees list
    if user.role == "manager":
        employees = User.objects.filter(role="employee")
        serializer = user_serializer.UserSerializer(employees, many=True)

        response_data["employees"] = serializer.data

    # If employee, send own details
    else:
        serializer = user_serializer.UserSerializer(user)
        response_data["employee"] = serializer.data

    return Response(response_data)


@api_view(['GET'])
def me(request):
    serializer = user_serializer.UserSerializer(request.user)
    return Response(serializer.data)

# employee_list
@api_view(['GET'])
def employee_list(request):

    employees = User.objects.filter(role="employee")

    data = []

    for employee in employees:
        data.append({
            "id": employee.id,
            "username": employee.username,
            "email": employee.email,
            "is_approved": employee.is_approved
        })

    return Response(data)


@api_view(['GET'])
def manager_list(request):

    managers = User.objects.filter(role="manager")

    data = []

    for manager in managers:
        data.append({
            "id": manager.id,
            "username": manager.username,
            "email": manager.email,
            "is_approved": manager.is_approved
        })

    return Response(data)


@api_view(['GET'])
def user_list(request):
    users = User.objects.filter(is_approved=True).exclude(id=request.user.id).order_by("username")
    exclude_id = request.query_params.get("exclude_id")

    if exclude_id:
        users = users.exclude(id=exclude_id)

    serializer = user_serializer.UserSerializer(users, many=True)

    return Response(serializer.data)


@api_view(['PUT'])
def approve_employee(request, id):

    try:
        employee = User.objects.get(id=id)
        employee.is_approved = True
        employee.save()

        return Response({
            "message": "Employee approved"
        })

    except User.DoesNotExist:
        return Response(
            {"error": "Employee not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['DELETE'])
def delete_employee(request, id):

    try:
        employee = User.objects.get(id=id)
        employee.delete()

        return Response({
            "message": "Employee deleted"
        })

    except User.DoesNotExist:
        return Response(
            {"error": "Employee not found"},
            status=status.HTTP_404_NOT_FOUND
        )





