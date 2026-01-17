from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.template import Template, Context, loader
from .models import MyUser, Salon, Message
from django.contrib.auth.hashers import make_password, check_password
from django.db.models import Q


def login(request):
    context = {}
    if request.method == "POST" :
        username = request.POST.get("username")
        password = request.POST.get("password")
        try :
            user = MyUser.objects.get(username_text = username)
            if check_password(password, user.password_text):
                request.session['user_id'] = user.id
                return redirect("main", name = username)
            else:
                context["error"] = "Invalid username or password"
        except MyUser.DoesNotExist:
            context["error"] = "Invalid username or password"
    return render(request, 'chatapp/index.html', context)

def logout(request):
    request.session.flush()
    return redirect('login')

def sign_up(request) :
    context = {}
    if request.method == "POST" :
        username = request.POST.get("username")
        password = request.POST.get("password")
        confirm_password = request.POST.get("confirm_password")
        if password != confirm_password:
            context["error"] = "Passwords do not match"
        else :
            if MyUser.objects.filter(username_text = username).exists() :
                context["error"] = "Username already exists"
            else :
                hashed_password = make_password(password)
                user = MyUser.objects.create(username_text=username, password_text=hashed_password)
                request.session['user_id'] = user.id
                return redirect("main", name = username)
    return render(request, 'chatapp/sign_up.html', context)

def main(request, name) :
    if 'user_id' not in request.session:
        return redirect('login')
    myuser = MyUser.objects.get(id=request.session['user_id'])
    if myuser.username_text != name:
        return redirect('main', name=myuser.username_text)
    
    if request.method == "POST" and "create_salon" in request.POST:
        salon_name = request.POST.get("salon_name")
        if salon_name:
            salon = Salon.objects.create(salon_name=salon_name, creator=myuser)
            salon.members.add(myuser)
    salons = Salon.objects.filter(Q(creator=myuser) | Q(members=myuser)).distinct().order_by("-created_at")
    context = {"username" : name,
               "salons" : salons,
               "myuser": myuser
               }
    return render(request, 'chatapp/main.html', context)

def messagerie(request, name, salon_id) :
    # Check user authentication
    if 'user_id' not in request.session:
        return redirect('login')
    myuser = MyUser.objects.get(id=request.session['user_id'])
    if myuser.username_text != name:
        return redirect('messagerie', name=myuser.username_text, salon_id=salon_id)
    
    salons = Salon.objects.filter(Q(creator=myuser) | Q(members=myuser)).distinct().order_by("-created_at")
    salon = Salon.objects.get(id = salon_id)
    # Check if user is member of the salon
    if myuser not in salon.members.all():
        return redirect('main', name=name)
    creator = salon.creator
    user_not_found = False
    user_already_in = False

    if request.method == "POST" :
        # Handle sending message
        if "send_message" in request.POST:
            my_message = request.POST.get("my_message")
            if my_message :
                Message.objects.create(user=myuser, salon=salon, message_text=my_message)
                return redirect("messagerie", name=name, salon_id=salon_id)
        # Handle salon creation
        elif "create_salon" in request.POST:
            salon_name = request.POST.get("salon_name")
            if salon_name:
                salon_created = Salon.objects.create(salon_name=salon_name, creator=myuser)
                salon_created.members.add(myuser)
                return redirect("messagerie", name=name, salon_id=salon_created.id)
        # Handle adding member to salon
        elif "add_member" in request.POST:
            member_name = request.POST.get("member_name")
            try:
                new_member = MyUser.objects.get(username_text=member_name)
                if new_member in salon.members.all():
                    user_already_in = True
                else:
                    salon.members.add(new_member)
            except MyUser.DoesNotExist:
                user_not_found = True 
        # Handle removing member from salon
        elif "remove_member" in request.POST:
            member_id = request.POST.get("remove_member")
            member_to_remove = MyUser.objects.get(id=member_id)
            salon.members.remove(member_to_remove)
        # Handle leaving salon
        elif "leave_salon" in request.POST:
            salon.members.remove(myuser)
            return redirect("main", name=name)
        # Handle deleting salon
        elif "delete_salon" in request.POST:
            salon.delete()
            return redirect("main", name=name)
        # Handle removing message
        elif "Remove_message" in request.POST:
            message_id = request.POST.get("remove_message")
            message_to_remove = Message.objects.get(id=message_id)
            message_to_remove.delete()

    members = salon.members.all()
    messages = salon.message_set.all().order_by("written_at")
    # Context
    context = {
        "username" : name,
        "salons" : salons,
        "salon" : salon,
        "salon_id": salon_id,
        "creator" : creator,
        "messages" : messages,
        "members" : members,
        "myuser" : myuser,
        "user_not_found": user_not_found,
        "user_already_in": user_already_in
        }
    return render(request, 'chatapp/messagerie.html', context)

# Ajax view to get messages
from django.http import JsonResponse
def get_messages(request, salon_id):
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    myuser = MyUser.objects.get(id=request.session['user_id'])
    after_id = request.GET.get('after_id')

    # Récupère tous les messages du salon, triés par date
    messages = Message.objects.filter(salon_id=salon_id).order_by('written_at')

    # Si on a after_id, ne garder que les messages plus récents (optional now)
    if after_id:
        messages = messages.filter(id__gt=int(after_id))

    data = []
    for msg in messages:
        data.append({
            "id": msg.id,
            "text": msg.message_text,
            "time": msg.written_at.strftime("%H:%M"),
            "username": msg.user.username_text,
            "is_me": msg.user == myuser,
            "can_delete": msg.user == myuser or myuser == msg.salon.creator
        })

    return JsonResponse(data, safe=False)

# Ajax view to get salon members
def get_members(request, salon_id):
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    myuser = MyUser.objects.get(id=request.session['user_id'])
    salon = Salon.objects.get(id=salon_id)
    members = salon.members.all()

    data = []
    for member in members:
        data.append({
            "id": member.id,
            "username_text": member.username_text,
            "is_me": member == myuser,
            "is_creator": member == salon.creator,
            "can_remove": myuser == salon.creator and member != salon.creator
        })

    return JsonResponse(data, safe=False)

# Ajax view to get salons
def get_salons(request):
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    myuser = MyUser.objects.get(id=request.session['user_id'])
    salons = Salon.objects.filter(Q(creator=myuser) | Q(members=myuser)).distinct().order_by("-created_at")

    data = []
    for salon in salons:
        data.append({
            "username": myuser.username_text,
            "id": salon.id,
            "salon_name": salon.salon_name,
            "is_me_creator": salon.creator == myuser,
            "is_me_member": myuser in salon.members.all(),
            "is_me_in": myuser in salon.members.all(),
            "created_at": salon.created_at.strftime("%d/%m/%Y %H:%M"),
        })

    return JsonResponse(data, safe=False)
